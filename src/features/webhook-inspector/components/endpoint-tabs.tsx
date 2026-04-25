"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Edit3,
  Eraser,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ENDPOINT_LIMIT,
  type Endpoint,
  useWebhookInspectorStore,
} from "../store";
import { createWebhookEndpoint } from "../actions";
import { buildEndpointUrl } from "./url";

export function EndpointTabs() {
  const endpoints = useWebhookInspectorStore((s) => s.endpoints);
  const endpointOrder = useWebhookInspectorStore((s) => s.endpointOrder);
  const activeEndpointId = useWebhookInspectorStore((s) => s.activeEndpointId);
  const setActiveEndpoint = useWebhookInspectorStore(
    (s) => s.setActiveEndpoint,
  );
  const addEndpoint = useWebhookInspectorStore((s) => s.addEndpoint);
  const renameEndpoint = useWebhookInspectorStore((s) => s.renameEndpoint);
  const deleteEndpoint = useWebhookInspectorStore((s) => s.deleteEndpoint);
  const clearRequests = useWebhookInspectorStore((s) => s.clearRequests);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const atCap = endpointOrder.length >= ENDPOINT_LIMIT;

  const handleCreate = async () => {
    if (atCap || creating) return;
    setCreating(true);
    try {
      const ep = await createWebhookEndpoint();
      addEndpoint(ep);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create endpoint");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (endpoint: Endpoint) => {
    await navigator.clipboard.writeText(buildEndpointUrl(endpoint));
    toast.success("URL copied");
  };

  return (
    <aside className="hidden md:flex flex-col w-56 border-r shrink-0">
      <div className="px-3 py-2 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCreate}
              disabled={atCap || creating}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {atCap ? `Limit reached (${ENDPOINT_LIMIT})` : "New endpoint"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
        Endpoints
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {endpointOrder.map((id) => {
          const ep = endpoints[id];
          if (!ep) return null;
          const isActive = ep.id === activeEndpointId;
          const isRenaming = renamingId === ep.id;
          return (
            <div
              key={ep.id}
              className={cn(
                "group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => setActiveEndpoint(ep.id)}
            >
              {isRenaming ? (
                <input
                  autoFocus
                  defaultValue={ep.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    renameEndpoint(ep.id, e.currentTarget.value);
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renameEndpoint(ep.id, e.currentTarget.value);
                      setRenamingId(null);
                    } else if (e.key === "Escape") {
                      setRenamingId(null);
                    }
                  }}
                  className="flex-1 min-w-0 bg-transparent outline-none ring-1 ring-border rounded px-1"
                />
              ) : (
                <span className="flex-1 truncate">{ep.name}</span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem onSelect={() => setRenamingId(ep.id)}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleCopy(ep)}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => clearRequests(ep.id)}>
                    <Eraser className="h-3.5 w-3.5" />
                    Clear requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => deleteEndpoint(ep.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete endpoint
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
