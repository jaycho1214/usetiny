"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { allTools } from "@/lib/tools";
import { getRecentOrder } from "@/lib/recent-tools";
import { Skeleton } from "@/components/ui/skeleton";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getSnapshot() {
  return localStorage.getItem("usetiny-recent-tools") ?? "";
}

function getServerSnapshot() {
  // Return a sentinel so we can show skeleton during SSR/hydration
  return "__ssr__";
}

export function ToolList() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const tools = useMemo(() => {
    if (raw === "__ssr__") return null;

    const recent = getRecentOrder();
    if (recent.length === 0) {
      return allTools.slice(0, 3);
    }
    const recentTools = recent
      .map((href) => allTools.find((t) => t.href === href))
      .filter(Boolean) as typeof allTools;
    const rest = allTools.filter((t) => !recent.includes(t.href));
    return [...recentTools, ...rest].slice(0, 3);
  }, [raw]);

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
    </ul>
  );
}
