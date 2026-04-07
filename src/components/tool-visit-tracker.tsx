"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { allTools } from "@/lib/tools";
import { recordVisit } from "@/lib/recent-tools";

const toolPaths = new Set(allTools.map((t) => t.href));

export function ToolVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (toolPaths.has(pathname)) {
      recordVisit(pathname);
    }
  }, [pathname]);

  return null;
}
