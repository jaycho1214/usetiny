"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, Ellipsis } from "lucide-react";
import Link from "next/link";
import { allTools } from "@/lib/tools";
import { getRecentOrder } from "@/lib/recent-tools";
import { getSeenAt, SEEN_AT_STORAGE_KEY } from "@/lib/new-tools-ack";
import {
  useLocalStorageValue,
  LOCAL_STORAGE_SSR_SENTINEL,
} from "@/hooks/use-local-storage-value";
import { Skeleton } from "@/components/ui/skeleton";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export function ToolList() {
  const recentRaw = useLocalStorageValue("usetiny-recent-tools");
  const seenAtRaw = useLocalStorageValue(SEEN_AT_STORAGE_KEY);

  const tools = useMemo(() => {
    if (recentRaw === LOCAL_STORAGE_SSR_SENTINEL) return null;

    const recent = getRecentOrder();
    if (recent.length === 0) {
      return allTools.slice(0, 3);
    }
    const recentTools = recent
      .map((href) => allTools.find((t) => t.href === href))
      .filter(Boolean) as typeof allTools;
    const rest = allTools.filter((t) => !recent.includes(t.href));
    return [...recentTools, ...rest].slice(0, 3);
  }, [recentRaw]);

  const hiddenNewCount = useMemo(() => {
    if (!tools) return 0;
    const shown = new Set(tools.map((t) => t.href));
    const seenAt = getSeenAt();
    return allTools.filter(
      (t) => Date.parse(t.addedAt) > seenAt && !shown.has(t.href),
    ).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools, seenAtRaw]);

  // Keep the last non-zero count visible while the badge fades out,
  // so users don't see "0 NEW" flash during the transition.
  const lastCountRef = useRef(hiddenNewCount);
  useEffect(() => {
    if (hiddenNewCount > 0) lastCountRef.current = hiddenNewCount;
  }, [hiddenNewCount]);
  const displayCount =
    hiddenNewCount > 0 ? hiddenNewCount : lastCountRef.current;

  if (!tools) {
    return (
      <ul className="space-y-1">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3.5 -mx-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  function openCommandPalette() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "/", bubbles: true }),
    );
  }

  return (
    <ul className="space-y-1">
      {tools.map((tool) => (
        <li key={tool.href}>
          <Link
            href={tool.href}
            className="group flex items-center gap-4 rounded-xl px-4 py-3.5 -mx-4 transition-all duration-150 hover:bg-accent active:scale-[0.98]"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted/60 group-hover:bg-muted transition-colors duration-150">
              <tool.icon className="size-[18px] text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{tool.name}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tool.description}
              </p>
            </div>
            <ArrowRight className="size-4 opacity-0 group-hover:opacity-60 transition-all duration-150 group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
      <li>
        <button
          onClick={openCommandPalette}
          className="group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 -mx-4 transition-all duration-150 hover:bg-accent active:scale-[0.98] text-left"
        >
          <div className="flex items-center justify-center size-10 rounded-lg border border-dashed border-muted-foreground/25 group-hover:border-muted-foreground/40 transition-colors duration-150">
            <Ellipsis className="size-[18px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors duration-150" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-150">
                More tools
              </span>
              {displayCount > 0 && (
                <span
                  aria-hidden={hiddenNewCount === 0}
                  className={cn(
                    "inline-flex items-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-background shadow-sm shadow-foreground/10 transition-opacity duration-300",
                    hiddenNewCount > 0 ? "opacity-100" : "opacity-0",
                  )}
                >
                  {displayCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
              Press <Kbd className="text-[10px]">/</Kbd> to search
            </p>
          </div>
        </button>
      </li>
    </ul>
  );
}
