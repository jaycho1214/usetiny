"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { usePdfDocument } from "../hooks/use-pdfjs";
import { usePDFEditorStore } from "../store";
import type { Annotation } from "../types";
import { exportPdf } from "../export-pdf";
import { duplicatePage, deletePage } from "../page-ops";
import { savePdfToIDB, loadPdfFromIDB, clearPdfFromIDB } from "../pdf-storage";
import { PDFDropzone } from "./pdf-dropzone";
import { PDFToolbar } from "./pdf-toolbar";
import { PDFSidebar } from "./pdf-sidebar";
import { PDFPageCanvas } from "./pdf-page-canvas";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { pdfEditorShortcutSections } from "./shortcuts";
import { useIsMac } from "@/hooks/use-is-mac";

export function PDFEditor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hydrated = useStoreHydration(usePDFEditorStore as any);
  const isMac = useIsMac();

  const pdfData = usePDFEditorStore((s) => s.pdfData);
  const fileName = usePDFEditorStore((s) => s.fileName);
  const currentPage = usePDFEditorStore((s) => s.currentPage);
  const setPdfData = usePDFEditorStore((s) => s.setPdfData);
  const restorePdfData = usePDFEditorStore((s) => s.restorePdfData);
  const setTotalPages = usePDFEditorStore((s) => s.setTotalPages);
  const setCurrentPage = usePDFEditorStore((s) => s.setCurrentPage);
  const zoom = usePDFEditorStore((s) => s.zoom);
  const setZoom = usePDFEditorStore((s) => s.setZoom);
  const setActiveTool = usePDFEditorStore((s) => s.setActiveTool);
  const selectedId = usePDFEditorStore((s) => s.selectedAnnotationId);
  const removeAnnotation = usePDFEditorStore((s) => s.removeAnnotation);
  const annotations = usePDFEditorStore((s) => s.annotations);
  const totalPages = usePDFEditorStore((s) => s.totalPages);
  const undo = usePDFEditorStore((s) => s.undo);
  const redo = usePDFEditorStore((s) => s.redo);
  const copySelected = usePDFEditorStore((s) => s.copySelected);
  const pasteClipboard = usePDFEditorStore((s) => s.pasteClipboard);
  const duplicateSelected = usePDFEditorStore((s) => s.duplicateSelected);
  const moveAnnotation = usePDFEditorStore((s) => s.moveAnnotation);
  const applyPageOp = usePDFEditorStore((s) => s.applyPageOp);
  const hasUnsavedChanges = usePDFEditorStore((s) => s.hasUnsavedChanges);
  const markSaved = usePDFEditorStore((s) => s.markSaved);
  const reset = usePDFEditorStore((s) => s.reset);
  const undoCount = usePDFEditorStore((s) => s._undoStack.length);
  const sidebarOpen = usePDFEditorStore((s) => s.sidebarOpen);

  const pdfDoc = usePdfDocument(pdfData);
  const [pageProxy, setPageProxy] = useState<PDFPageProxy | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [pdfRestored, setPdfRestored] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [editingPage, setEditingPage] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Restore PDF from IndexedDB after hydration
  useEffect(() => {
    if (!hydrated || pdfRestored) return;
    setPdfRestored(true);
    const storedFileName = usePDFEditorStore.getState().fileName;
    if (storedFileName && !usePDFEditorStore.getState().pdfData) {
      loadPdfFromIDB().then((data) => {
        if (data) restorePdfData(data);
      });
    }
  }, [hydrated, pdfRestored, restorePdfData]);

  // Save PDF to IndexedDB when it changes
  useEffect(() => {
    if (!hydrated) return;
    if (pdfData) savePdfToIDB(pdfData);
    else clearPdfFromIDB();
  }, [pdfData, hydrated]);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && pdfData) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges, pdfData]);

  // Update total pages
  useEffect(() => {
    if (pdfDoc) setTotalPages(pdfDoc.numPages);
  }, [pdfDoc, setTotalPages]);

  // Import existing form fields from the PDF
  const importedForDoc = useRef<unknown>(null);
  useEffect(() => {
    if (!pdfDoc) return;
    if (importedForDoc.current === pdfDoc) return;
    importedForDoc.current = pdfDoc;

    // Skip if annotations were restored from persistence (previous session with same file)
    const stored = usePDFEditorStore.getState().annotations;
    if (stored.length > 0) return;

    const doc = pdfDoc;
    (async () => {
      const { nanoid } = await import("nanoid");
      const imported: Annotation[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        const pg = await doc.getPage(i + 1);
        const vp = pg.getViewport({ scale: 1 });
        const anns = await pg.getAnnotations({ intent: "display" });
        for (const a of anns) {
          if (a.subtype !== "Widget") continue;
          const [llx, lly, urx, ury] = a.rect;
          const w = urx - llx,
            h = ury - lly;
          if (w <= 0 || h <= 0) continue;
          const ft =
            a.fieldType === "Btn"
              ? "checkbox"
              : a.fieldType === "Ch"
                ? "dropdown"
                : "text";
          imported.push({
            id: nanoid(),
            type: "form",
            fieldType: ft,
            pageIndex: i,
            position: { x: llx / vp.width, y: 1 - ury / vp.height },
            size: { width: w / vp.width, height: h / vp.height },
            label: a.fieldName || "",
            value: a.fieldValue ?? "",
            checked: ft === "checkbox" ? !!a.fieldValue : false,
          });
        }
      }
      // Batch-set all annotations at once (avoids N individual store updates)
      if (imported.length > 0) {
        usePDFEditorStore.setState({
          annotations: imported,
          hasUnsavedChanges: false,
        });
      }
    })();
  }, [pdfDoc]);

  // Load current page proxy
  useEffect(() => {
    if (!pdfDoc) {
      setPageProxy(null);
      return;
    }
    let cancelled = false;
    pdfDoc.getPage(currentPage + 1).then((page) => {
      if (!cancelled) setPageProxy(page);
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage]);

  // Native zoom (Ctrl/Cmd + scroll / trackpad pinch)
  useEffect(() => {
    if (!pdfData) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.002;
        setZoom((z) => Math.max(0.25, Math.min(3, z + delta)));
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, [setZoom, pdfData]);

  const handleExportRef = useRef<() => void>(() => {});
  const copiedPageRef = useRef<number | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleExportRef.current();
        return;
      }
      // Bold/Italic toggle on selected text annotation
      if (mod && e.key === "b" && selectedId) {
        const ann = usePDFEditorStore
          .getState()
          .annotations.find((a) => a.id === selectedId);
        if (ann?.type === "text") {
          e.preventDefault();
          usePDFEditorStore
            .getState()
            .updateAnnotation(selectedId, { bold: !ann.bold });
          return;
        }
      }
      if (mod && e.key === "i" && selectedId) {
        const ann = usePDFEditorStore
          .getState()
          .annotations.find((a) => a.id === selectedId);
        if (ann?.type === "text") {
          e.preventDefault();
          usePDFEditorStore
            .getState()
            .updateAnnotation(selectedId, { italic: !ann.italic });
          return;
        }
      }
      if (mod && (e.key === "c" || e.key === "C") && !e.shiftKey) {
        e.preventDefault();
        if (selectedId) {
          copySelected();
        } else if (pdfData) {
          copiedPageRef.current = currentPage;
          toast.success(`Page ${currentPage + 1} copied`);
        }
        return;
      }
      if (mod && (e.key === "v" || e.key === "V") && !e.shiftKey) {
        e.preventDefault();
        if (selectedId || copiedPageRef.current === null) {
          pasteClipboard();
        } else if (pdfData && copiedPageRef.current !== null) {
          duplicatePage(pdfData, copiedPageRef.current).then((r) => {
            applyPageOp(r.data, r.totalPages, r.updateAnnotations);
            toast.success("Page pasted");
          });
        }
        return;
      }
      if (mod && (e.key === "x" || e.key === "X")) {
        if (selectedId) {
          e.preventDefault();
          copySelected();
          removeAnnotation(selectedId);
        }
        return;
      }
      if (mod && (e.key === "d" || e.key === "D")) {
        if (selectedId) {
          e.preventDefault();
          duplicateSelected();
        }
        return;
      }

      if (isInput) return;

      switch (e.key) {
        case "v":
        case "V":
          setActiveTool("select");
          break;
        case "t":
        case "T":
          setActiveTool("text");
          break;
        case "d":
        case "D":
          setActiveTool("draw");
          break;
        case "h":
        case "H":
          setActiveTool("highlight");
          break;
        case "f":
        case "F":
          setActiveTool("form");
          break;
        case "g":
        case "G":
          setActiveTool("fill");
          break;
        case "e":
        case "E":
          setActiveTool("eraser");
          break;
        case "Delete":
        case "Backspace":
          if (selectedId) {
            e.preventDefault();
            removeAnnotation(selectedId);
          } else if (pdfData && totalPages > 1) {
            e.preventDefault();
            deletePage(pdfData, currentPage).then((r) => {
              applyPageOp(r.data, r.totalPages, r.updateAnnotations);
              toast.success("Page deleted");
            });
          }
          break;
        case "Escape":
          usePDFEditorStore.getState().setSelectedAnnotationId(null);
          break;
        case "ArrowLeft":
          if (selectedId) {
            e.preventDefault();
            moveAnnotation(selectedId, e.shiftKey ? -0.01 : -0.002, 0);
          } else if (currentPage > 0) {
            e.preventDefault();
            setCurrentPage(currentPage - 1);
          }
          break;
        case "ArrowRight":
          if (selectedId) {
            e.preventDefault();
            moveAnnotation(selectedId, e.shiftKey ? 0.01 : 0.002, 0);
          } else if (currentPage < totalPages - 1) {
            e.preventDefault();
            setCurrentPage(currentPage + 1);
          }
          break;
        case "ArrowUp":
          if (selectedId) {
            e.preventDefault();
            moveAnnotation(selectedId, 0, e.shiftKey ? -0.01 : -0.002);
          }
          break;
        case "ArrowDown":
          if (selectedId) {
            e.preventDefault();
            moveAnnotation(selectedId, 0, e.shiftKey ? 0.01 : 0.002);
          }
          break;
        case "=":
        case "+":
          if (mod) {
            e.preventDefault();
            setZoom((z) => Math.min(3, z + 0.25));
          }
          break;
        case "-":
          if (mod) {
            e.preventDefault();
            setZoom((z) => Math.max(0.25, z - 0.25));
          }
          break;
        case "0":
          if (mod) {
            e.preventDefault();
            setZoom(1);
          }
          break;
        case "?":
          setShowShortcuts(true);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedId,
    currentPage,
    totalPages,
    pdfData,
    setActiveTool,
    removeAnnotation,
    setCurrentPage,
    setZoom,
    undo,
    redo,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    moveAnnotation,
    applyPageOp,
  ]);

  const handleExport = useCallback(async () => {
    if (!pdfData) return;
    setExporting(true);
    try {
      const buffer = await exportPdf(pdfData, annotations);
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/\.pdf$/i, "") + "_edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      markSaved();
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }, [pdfData, annotations, fileName, markSaved]);
  handleExportRef.current = handleExport;

  const handleCloseFile = useCallback(() => {
    if (hasUnsavedChanges) setShowCloseConfirm(true);
    else {
      reset();
      clearPdfFromIDB();
    }
  }, [hasUnsavedChanges, reset]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    reset();
    clearPdfFromIDB();
  }, [reset]);

  const handlePageSubmit = useCallback(() => {
    const num = parseInt(pageInput);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPage(num - 1);
    }
    setEditingPage(false);
    setPageInput("");
  }, [pageInput, totalPages, setCurrentPage]);

  const handleFileLoad = useCallback(
    (data: ArrayBuffer, name: string) => {
      importedForDoc.current = null;
      setPdfData(data, name);
    },
    [setPdfData],
  );

  if (!hydrated) return <FullscreenLoading />;

  if (!pdfData) {
    return (
      <div className="flex h-[calc(100dvh-1px)] flex-col bg-background">
        <PDFDropzone onFileLoad={handleFileLoad} />
      </div>
    );
  }

  const annotationCount = annotations.length;

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-background">
      <PDFToolbar
        onExport={handleExport}
        exporting={exporting}
        onShowShortcuts={() => setShowShortcuts(true)}
        onClose={handleCloseFile}
      />

      <div className="flex min-h-0 flex-1">
        {pdfDoc && sidebarOpen && <PDFSidebar pdfDoc={pdfDoc} />}
        <div
          ref={viewerRef}
          className="relative flex-1 overflow-auto bg-muted/40"
          style={{ touchAction: "none" }}
        >
          <div className="flex min-h-full min-w-fit items-start justify-center p-4 md:p-8">
            {pageProxy && (
              <PDFPageCanvas page={pageProxy} pageIndex={currentPage} />
            )}
          </div>
        </div>
      </div>

      {/* Status bar with zoom + page nav */}
      <div className="flex items-center justify-between border-t bg-background px-2 py-1">
        {/* Left: file info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden max-w-36 truncate sm:inline">{fileName}</span>
          {hasUnsavedChanges && (
            <Badge
              variant="outline"
              className="h-4 border-yellow-500/50 px-1 text-[9px] text-yellow-600 dark:text-yellow-400"
            >
              Unsaved
            </Badge>
          )}
          {annotationCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              {annotationCount}
            </Badge>
          )}
        </div>

        {/* Center: page nav */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {editingPage ? (
            <Input
              autoFocus
              className="h-6 w-12 px-1 text-center text-xs"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePageSubmit();
                if (e.key === "Escape") {
                  setEditingPage(false);
                  setPageInput("");
                }
              }}
            />
          ) : (
            <button
              className="min-w-[3rem] rounded px-1 py-0.5 text-center text-xs tabular-nums text-muted-foreground hover:bg-accent"
              onClick={() => {
                setEditingPage(true);
                setPageInput(String(currentPage + 1));
              }}
            >
              {currentPage + 1} / {totalPages}
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: zoom controls */}
        <div className="flex items-center gap-0.5">
          {undoCount > 0 && (
            <span className="mr-2 hidden text-[10px] text-muted-foreground sm:inline">
              {undoCount} undo
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          <button
            className="min-w-[2.5rem] rounded px-1 py-0.5 text-center text-[10px] tabular-nums text-muted-foreground hover:bg-accent"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        sections={pdfEditorShortcutSections(isMac)}
        maxWidth={448}
      />

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved annotations. Export first to save your work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
