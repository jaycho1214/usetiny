"use client";

import { Inbox } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWebhookInspectorStore } from "../store";
import { useNow } from "./use-now";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-amber-600 dark:text-amber-400",
  DELETE: "text-red-600 dark:text-red-400",
  HEAD: "text-muted-foreground",
  OPTIONS: "text-muted-foreground",
};

export function RequestList({ endpointId }: { endpointId: string }) {
  const requests = useWebhookInspectorStore(
    (s) => s.requests[endpointId] ?? [],
  );
  const selectedId = useWebhookInspectorStore(
    (s) => s.selectedRequestId[endpointId] ?? null,
  );
  const selectRequest = useWebhookInspectorStore((s) => s.selectRequest);
  const now = useNow();

  if (requests.length === 0) {
    return (
      <div className="w-full md:w-80 shrink-0 md:border-r flex items-center justify-center px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Inbox className="h-6 w-6 opacity-50" />
          <p className="text-sm">Waiting for requests…</p>
          <p className="text-[11px] opacity-70">
            POST to the URL above and it appears here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 shrink-0 md:border-r flex flex-col min-h-0">
      <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 border-b">
        Requests · {requests.length}
      </div>
      <ScrollArea className="flex-1">
        <ul className="py-1">
          {requests.map((r) => {
            const isActive = r.id === selectedId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => selectRequest(endpointId, r.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 flex items-baseline gap-2 transition-colors border-l-2",
                    isActive
                      ? "bg-secondary border-foreground"
                      : "border-transparent hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold w-12 shrink-0",
                      METHOD_COLORS[r.method] ?? "text-muted-foreground",
                    )}
                  >
                    {r.method}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm font-mono">
                    {r.path}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                    {formatRelative(now - r.receivedAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

function formatRelative(diff: number): string {
  if (diff < 5_000) return "now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`;
  return `${Math.floor(diff / (24 * 60 * 60_000))}d`;
}
