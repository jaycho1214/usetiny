"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Endpoint } from "../store";
import { buildEndpointUrl } from "./url";

export function UrlDisplay({ endpoint }: { endpoint: Endpoint }) {
  const url = useMemo(() => buildEndpointUrl(endpoint), [endpoint]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("URL copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="px-4 pt-3 pb-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate font-mono text-xs px-2.5 py-1.5 rounded-md bg-muted text-foreground/90">
          {url}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={copy}
          className="shrink-0 gap-1.5"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Send any HTTP method to this URL. Requests are only captured while this
        tab is open.
      </p>
    </div>
  );
}
