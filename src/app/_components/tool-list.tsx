"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { allTools } from "@/lib/tools";
import { getRecentOrder } from "@/lib/recent-tools";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getSnapshot() {
  return localStorage.getItem("usetiny-recent-tools") ?? "";
}

function getServerSnapshot() {
  return "";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ToolList() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const tools = useMemo(() => {
    const recent = getRecentOrder();
    if (recent.length === 0) {
      return shuffle(allTools).slice(0, 3);
    }
    const recentTools = recent
      .map((href) => allTools.find((t) => t.href === href))
      .filter(Boolean) as typeof allTools;
    const rest = allTools.filter((t) => !recent.includes(t.href));
    return [...recentTools, ...rest].slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

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
