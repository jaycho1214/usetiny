"use client";

import { useMarkdownStore } from "../store";
import { useIsMac } from "@/hooks/use-is-mac";
import { useKeyboardShortcuts } from "./keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Download, Keyboard } from "lucide-react";
import { useRef, useState, useCallback, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import Link from "next/link";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { ExportSettings } from "./export-settings";
import { MarkdownPreview } from "./markdown-preview";
import { PrintStyles } from "./print-styles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { exportPdf } from "../export-pdf";

const MAX_CONTENT_LENGTH = 1_000_000;

export default function MarkdownContent() {
  const content = useMarkdownStore((s) => s.content);
  const viewMode = useMarkdownStore((s) => s.viewMode);
  const exportSettings = useMarkdownStore((s) => s.exportSettings);
  const updateContent = useMarkdownStore((s) => s.updateContent);
  const setViewMode = useMarkdownStore((s) => s.setViewMode);
  const isMac = useIsMac();
  const rehydrated = useStoreHydration(useMarkdownStore);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleExport = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Nothing to export");
      return;
    }
    try {
      await exportPdf(content, exportSettings.filename);
    } catch (err) {
      console.error("[markdown export] failed:", err);
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(`Export failed: ${message}`);
    }
  }, [content, exportSettings.filename]);

  const handleGlobalPaste = useCallback(
    (text: string) => {
      updateContent(text);
      setViewMode("preview");
    },
    [updateContent, setViewMode],
  );

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const name = file.name.toLowerCase();
      const isMarkdown =
        name.endsWith(".md") ||
        name.endsWith(".markdown") ||
        name.endsWith(".mdx") ||
        name.endsWith(".txt") ||
        file.type.startsWith("text/");
      if (!isMarkdown) {
        toast.error("Only Markdown or text files are supported");
        return;
      }
      try {
        const text = await file.text();
        if (text.length > MAX_CONTENT_LENGTH) {
          toast.error("File too large (1MB limit)");
          return;
        }
        updateContent(text);
        setViewMode("preview");
        toast.success(`Loaded ${file.name}`);
      } catch {
        toast.error("Failed to read file");
      }
    },
    [updateContent, setViewMode],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDraggingOver(false);
  }, []);

  useKeyboardShortcuts({
    textareaRef,
    onExport: handleExport,
    onShowShortcuts: () => setShowShortcuts(true),
    onSetViewMode: setViewMode,
    onGlobalPaste: handleGlobalPaste,
  });

  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );

  if (!rehydrated) {
    return <FullscreenLoading />;
  }

  const isEmpty = content === "";
  const showEditor = viewMode === "editor" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  return (
    <div
      className="md-print-root h-dvh flex flex-col"
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <PrintStyles settings={exportSettings} />

      {isDraggingOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm print:hidden">
          <div className="rounded-lg border-2 border-dashed border-foreground/30 px-8 py-4 text-sm text-muted-foreground">
            Drop a Markdown file to open
          </div>
        </div>
      )}

      {/* Navbar */}
      <div className="bg-background px-4 py-2 flex items-center gap-2 print:hidden">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Markdown
        </span>

        <div className="flex-1" />

        {/* View mode toggle */}
        <ButtonGroup>
          {(
            [
              { mode: "editor", label: "Editor", key: "1" },
              { mode: "split", label: "Split", key: "2" },
              { mode: "preview", label: "Preview", key: "3" },
            ] as const
          ).map(({ mode, label, key }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={viewMode === mode ? "default" : "outline"}
                  onClick={() => setViewMode(mode)}
                  className="h-7 px-2.5 text-xs"
                >
                  {label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <KbdGroup>
                  <Kbd>{isMac ? "⌘" : "Ctrl+"}</Kbd>
                  <Kbd>{key}</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>
          ))}
        </ButtonGroup>

        {/* Action buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowShortcuts(true)}
              className="h-7 w-7"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>

        <ExportSettings />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={handleExport}
              className="h-7 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <KbdGroup>
              <Kbd>{isMac ? "⌘" : "Ctrl+"}</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>E</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main content */}
      <div className="md-print-main flex-1 flex overflow-hidden">
        {/* Editor pane */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 print:hidden",
            !showEditor && "hidden",
          )}
        >
          {isEmpty && (
            <p className="text-sm text-muted-foreground/50 px-6 pt-6 leading-relaxed select-none">
              Paste, type, or drop a .md file here.
              <br />
              {isMac ? "⌘" : "Ctrl+"}⇧E to export as PDF.
            </p>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.length <= MAX_CONTENT_LENGTH) {
                updateContent(newValue);
              } else {
                toast.error("Content limit reached (1MB)");
              }
            }}
            className="flex-1 w-full resize-none outline-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/40 p-6 font-mono"
            placeholder="# Hello World"
            autoFocus={viewMode !== "preview"}
            spellCheck={false}
          />
        </div>

        {/* Divider */}
        {viewMode === "split" && (
          <div className="w-px bg-border print:hidden" />
        )}

        {/* Preview pane — always in DOM for print, visually hidden when not active */}
        <div
          ref={previewRef}
          className={cn(
            "md-print-preview-pane flex-1 min-w-0 overflow-y-auto",
            !showPreview && "hidden print:block",
          )}
        >
          <MarkdownPreview content={content} />
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-background px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-3 border-t print:hidden">
        <span className="opacity-60">Markdown</span>
        <div className="flex-1" />
        <span className="opacity-60">Saved</span>
        <span>{wordCount} words</span>
        <span>{content.length} chars</span>
      </div>

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        isMac={isMac}
      />
    </div>
  );
}
