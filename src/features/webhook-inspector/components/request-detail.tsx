"use client";

import { useMemo } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { type CapturedRequest, useWebhookInspectorStore } from "../store";

export function RequestDetail({ endpointId }: { endpointId: string }) {
  const requests = useWebhookInspectorStore(
    (s) => s.requests[endpointId] ?? [],
  );
  const selectedId = useWebhookInspectorStore(
    (s) => s.selectedRequestId[endpointId] ?? null,
  );

  const selected: CapturedRequest | null = useMemo(() => {
    if (!selectedId) return requests[0] ?? null;
    return requests.find((r) => r.id === selectedId) ?? requests[0] ?? null;
  }, [requests, selectedId]);

  const headerEntries = useMemo(
    () => (selected ? Object.entries(selected.headers) : []),
    [selected],
  );
  const queryEntries = useMemo(
    () => (selected ? Object.entries(selected.query) : []),
    [selected],
  );

  if (!selected) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a request to inspect.
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-1 flex-col min-w-0 min-h-0">
      <div className="px-4 py-3 border-b flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide">
          {selected.method}
        </span>
        <code className="text-xs font-mono truncate flex-1 min-w-0">
          {selected.path}
        </code>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {new Date(selected.receivedAt).toLocaleTimeString()}
        </span>
      </div>

      <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">
            Headers · {headerEntries.length}
          </TabsTrigger>
          <TabsTrigger value="query">Query · {queryEntries.length}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="body"
          className="flex-1 min-h-0 overflow-hidden mt-2"
        >
          <Body request={selected} />
        </TabsContent>
        <TabsContent
          value="headers"
          className="flex-1 min-h-0 overflow-hidden mt-2"
        >
          <KeyValueTable rows={headerEntries} emptyText="No headers" />
        </TabsContent>
        <TabsContent
          value="query"
          className="flex-1 min-h-0 overflow-hidden mt-2"
        >
          <KeyValueTable rows={queryEntries} emptyText="No query params" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KeyValueTable({
  rows,
  emptyText,
}: {
  rows: [string, string][];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">{emptyText}</div>
    );
  }
  return (
    <ScrollArea className="h-full">
      <div className="px-4 pb-4">
        <table className="w-full text-xs font-mono">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b last:border-b-0">
                <td className="py-1.5 pr-4 text-muted-foreground align-top whitespace-nowrap">
                  {k}
                </td>
                <td className="py-1.5 break-all">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}

function Body({ request }: { request: CapturedRequest }) {
  const { bodyText, bodyBase64, contentType, size, truncated } = request;

  const pretty = useMemo(() => {
    if (!bodyText) return null;
    if (!isJsonLike(contentType, bodyText)) return null;
    try {
      return JSON.stringify(JSON.parse(bodyText), null, 2);
    } catch {
      return null;
    }
  }, [bodyText, contentType]);

  const display = pretty ?? bodyText ?? null;

  if (size === 0) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">No body</div>
    );
  }

  if (display !== null) {
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="px-4 pb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {size} bytes{truncated ? " (truncated)" : ""}
            {contentType ? ` · ${contentType}` : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={async () => {
              await navigator.clipboard.writeText(display);
              toast.success("Body copied");
            }}
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <pre className="px-4 pb-4 text-xs font-mono whitespace-pre-wrap break-all">
            {display}
          </pre>
        </ScrollArea>
      </div>
    );
  }

  if (bodyBase64) {
    return (
      <div className="px-4 py-6 flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          Binary content · {size} bytes
          {contentType ? ` · ${contentType}` : ""}
          {truncated ? " (truncated)" : ""}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => downloadBase64(bodyBase64, contentType)}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    );
  }

  return null;
}

function isJsonLike(contentType: string, text: string): boolean {
  if (contentType.toLowerCase().includes("json")) return true;
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function downloadBase64(base64: string, contentType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: contentType || "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `webhook-body-${Date.now()}.bin`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
