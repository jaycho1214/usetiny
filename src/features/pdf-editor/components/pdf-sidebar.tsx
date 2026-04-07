"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ArrowDown, ArrowUp, Copy, RotateCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { usePDFEditorStore } from "../store";
import { duplicatePage, deletePage, rotatePage, movePageUp, movePageDown } from "../page-ops";

interface Props {
  pdfDoc: PDFDocumentProxy;
}

export function PDFSidebar({ pdfDoc }: Props) {
  const totalPages = usePDFEditorStore((s) => s.totalPages);
  const currentPage = usePDFEditorStore((s) => s.currentPage);
  const setCurrentPage = usePDFEditorStore((s) => s.setCurrentPage);
  const sidebarOpen = usePDFEditorStore((s) => s.sidebarOpen);
  const annotations = usePDFEditorStore((s) => s.annotations);
  const pdfData = usePDFEditorStore((s) => s.pdfData);
  const applyPageOp = usePDFEditorStore((s) => s.applyPageOp);

  const annotationCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const a of annotations) {
      counts.set(a.pageIndex, (counts.get(a.pageIndex) ?? 0) + 1);
    }
    return counts;
  }, [annotations]);

  const handlePageOp = useCallback(async (op: () => Promise<{ data: ArrayBuffer; totalPages: number; updateAnnotations: (anns: typeof annotations) => typeof annotations }>) => {
    if (!pdfData) return;
    try {
      const result = await op();
      applyPageOp(result.data, result.totalPages, result.updateAnnotations);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [pdfData, applyPageOp]);

  if (!sidebarOpen) return null;

  return (
    <div className="flex w-28 shrink-0 flex-col gap-0 overflow-y-auto border-r bg-muted/30">
      <div className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Pages
      </div>
      {Array.from({ length: totalPages }, (_, i) => (
        <ContextMenu key={i}>
          <ContextMenuTrigger asChild>
            <div>
              <ThumbnailPage
                pdfDoc={pdfDoc}
                pageIndex={i}
                isActive={currentPage === i}
                annotationCount={annotationCounts.get(i) ?? 0}
                onClick={() => setCurrentPage(i)}
              />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handlePageOp(() => duplicatePage(pdfData!, i))}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handlePageOp(() => rotatePage(pdfData!, i))}>
              <RotateCw className="mr-2 h-3.5 w-3.5" /> Rotate 90°
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={i === 0}
              onClick={() => { handlePageOp(() => movePageUp(pdfData!, i)); setCurrentPage(Math.max(0, i - 1)); }}
            >
              <ArrowUp className="mr-2 h-3.5 w-3.5" /> Move Up
            </ContextMenuItem>
            <ContextMenuItem
              disabled={i >= totalPages - 1}
              onClick={() => { handlePageOp(() => movePageDown(pdfData!, i, totalPages)); setCurrentPage(Math.min(totalPages - 1, i + 1)); }}
            >
              <ArrowDown className="mr-2 h-3.5 w-3.5" /> Move Down
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={totalPages <= 1}
              className="text-destructive focus:text-destructive"
              onClick={() => handlePageOp(() => deletePage(pdfData!, i))}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}

const ThumbnailPage = React.memo(function ThumbnailPage({
  pdfDoc,
  pageIndex,
  isActive,
  annotationCount,
  onClick,
}: {
  pdfDoc: PDFDocumentProxy;
  pageIndex: number;
  isActive: boolean;
  annotationCount: number;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Scroll active page into view
  useEffect(() => {
    if (isActive && btnRef.current) {
      btnRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  useEffect(() => {
    let cancelled = false;
    pdfDoc.getPage(pageIndex + 1).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvas, canvasContext: ctx, viewport });
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageIndex]);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      className={cn("group relative overflow-hidden border-2 transition-all", isActive ? "border-blue-500" : "border-transparent hover:bg-accent")}
    >
      <canvas ref={canvasRef} className="w-full bg-white" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-3">
        <span className="text-[10px] font-medium text-white/90">
          {pageIndex + 1}
        </span>
        {annotationCount > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[9px] leading-none">
            {annotationCount}
          </Badge>
        )}
      </div>
    </button>
  );
});
