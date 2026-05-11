"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Download, Keyboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { useIsMac } from "@/hooks/use-is-mac";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { useImageStore } from "../store";
import {
  mimeToFormat,
  formatBytes,
  formatToExt,
  formatToMime,
  computeSavings,
  openImagePicker,
  readAllFiles,
  filterImageFiles,
  THUMBNAIL_SIZE,
  QUALITY_DEBOUNCE_MS,
  BUILTIN_PRESETS,
  RESIZE_PRESETS,
} from "../constants";
import { readExif } from "../exif";
import type { ImageFile, WorkerResponse, ImagePreset } from "../types";
import { ImageDropzone } from "./image-dropzone";
import { FileSidebar } from "./file-sidebar";
import { SplitView } from "./split-view";
import { CompressionControls } from "./compression-controls";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { imageShortcutSections } from "./shortcuts";

export default function ImageContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hydrated = useStoreHydration(useImageStore as any);
  const isMac = useIsMac();

  const files = useImageStore((s) => s.files);
  const fileOrder = useImageStore((s) => s.fileOrder);
  const activeFileId = useImageStore((s) => s.activeFileId);
  const splitPosition = useImageStore((s) => s.splitPosition);
  const outputFormat = useImageStore((s) => s.outputFormat);
  const qualityMode = useImageStore((s) => s.qualityMode);
  const quality = useImageStore((s) => s.quality);
  const targetSizeKB = useImageStore((s) => s.targetSizeKB);
  const resizeMode = useImageStore((s) => s.resizeMode);
  const resizeWidth = useImageStore((s) => s.resizeWidth);
  const resizeHeight = useImageStore((s) => s.resizeHeight);
  const resizePercent = useImageStore((s) => s.resizePercent);
  const resizePresetId = useImageStore((s) => s.resizePresetId);
  const aspectRatioLocked = useImageStore((s) => s.aspectRatioLocked);
  const stripMetadata = useImageStore((s) => s.stripMetadata);
  const stripGps = useImageStore((s) => s.stripGps);
  const stripCamera = useImageStore((s) => s.stripCamera);
  const keepCopyright = useImageStore((s) => s.keepCopyright);
  const customPresets = useImageStore((s) => s.customPresets);

  const addFile = useImageStore((s) => s.addFile);
  const removeFile = useImageStore((s) => s.removeFile);
  const removeAllFiles = useImageStore((s) => s.removeAllFiles);
  const setActiveFile = useImageStore((s) => s.setActiveFile);
  const setSplitPosition = useImageStore((s) => s.setSplitPosition);
  const setOutputFormat = useImageStore((s) => s.setOutputFormat);
  const setQualityMode = useImageStore((s) => s.setQualityMode);
  const setQuality = useImageStore((s) => s.setQuality);
  const setTargetSizeKB = useImageStore((s) => s.setTargetSizeKB);
  const setResizeMode = useImageStore((s) => s.setResizeMode);
  const setResizeDimensions = useImageStore((s) => s.setResizeDimensions);
  const setResizePercent = useImageStore((s) => s.setResizePercent);
  const setResizePresetId = useImageStore((s) => s.setResizePresetId);
  const toggleAspectRatioLock = useImageStore((s) => s.toggleAspectRatioLock);
  const setStripMetadata = useImageStore((s) => s.setStripMetadata);
  const setStripGps = useImageStore((s) => s.setStripGps);
  const setStripCamera = useImageStore((s) => s.setStripCamera);
  const setKeepCopyright = useImageStore((s) => s.setKeepCopyright);
  const applyPreset = useImageStore((s) => s.applyPreset);
  const saveCustomPreset = useImageStore((s) => s.saveCustomPreset);
  const deleteCustomPreset = useImageStore((s) => s.deleteCustomPreset);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const processingQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isInitialMount = useRef(true);

  // Active file
  const activeFile = activeFileId ? files[activeFileId] : null;
  const orderedFiles = fileOrder.map((id) => files[id]).filter(Boolean);
  const hasFiles = fileOrder.length > 0;

  // ── Worker lifecycle ──────────────────────────────────

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../worker/codec-worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const store = useImageStore.getState();
      if (msg.type === "result") {
        const blob = new Blob([msg.data], {
          type: formatToMime(msg.format),
        });
        const url = URL.createObjectURL(blob);
        store.updateFile(msg.fileId, {
          processedBlob: blob,
          processedUrl: url,
          processedSize: msg.data.byteLength,
          processedWidth: msg.width,
          processedHeight: msg.height,
          status: "done",
          error: null,
        });
        isProcessing.current = false;
        processNext();
      } else if (msg.type === "error") {
        store.updateFile(msg.fileId, { status: "error", error: msg.message });
        isProcessing.current = false;
        processNext();
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processNext = useCallback(() => {
    if (isProcessing.current || processingQueue.current.length === 0) return;
    if (!workerRef.current) {
      isProcessing.current = false;
      return;
    }
    const fileId = processingQueue.current.shift()!;
    const state = useImageStore.getState();
    const file = state.files[fileId];
    if (!file) {
      processNext();
      return;
    }

    isProcessing.current = true;
    state.updateFile(fileId, { status: "processing", error: null });

    // Use File.arrayBuffer() directly — avoids fetch() overhead on blob URLs
    file.file
      .arrayBuffer()
      .then((buffer) => {
        const format = file.overrideFormat ?? state.outputFormat;
        const q = file.overrideQuality ?? state.quality;

        workerRef.current?.postMessage(
          {
            type: "process",
            fileId,
            imageData: buffer,
            sourceFormat: file.originalFormat,
            targetFormat: format,
            quality: q,
            targetSizeKB:
              state.qualityMode === "target" ? state.targetSizeKB : null,
            resize: {
              mode: state.resizeMode,
              width: state.resizeWidth,
              height: state.resizeHeight,
              percent: state.resizePercent,
              originalWidth: file.originalWidth,
              originalHeight: file.originalHeight,
            },
          },
          [buffer],
        );
      })
      .catch(() => {
        useImageStore.getState().updateFile(fileId, {
          status: "error",
          error: "Failed to read file",
        });
        isProcessing.current = false;
        processNext();
      });
  }, []);

  const enqueueFile = useCallback(
    (fileId: string) => {
      processingQueue.current = processingQueue.current.filter(
        (id) => id !== fileId,
      );
      processingQueue.current.push(fileId);
      processNext();
    },
    [processNext],
  );

  const enqueueAll = useCallback(() => {
    processingQueue.current = [...useImageStore.getState().fileOrder];
    const active = useImageStore.getState().activeFileId;
    if (active) {
      processingQueue.current = processingQueue.current.filter(
        (id) => id !== active,
      );
      processingQueue.current.unshift(active);
    }
    processNext();
  }, [processNext]);

  // Skip initial mount to avoid redundant enqueueAll
  useEffect(() => {
    if (!hasFiles) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      enqueueAll();
    }, QUALITY_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    outputFormat,
    qualityMode,
    quality,
    targetSizeKB,
    resizeMode,
    resizeWidth,
    resizeHeight,
    resizePercent,
    resizePresetId,
  ]);

  // ── File loading ──────────────────────────────────────

  const loadFiles = useCallback(
    async (inputFiles: File[]) => {
      // Parallelize bitmap decoding + EXIF reading
      const prepared = await Promise.all(
        inputFiles.map(async (file) => {
          const id = nanoid();
          const bitmap = await createImageBitmap(file);
          const thumbScale =
            THUMBNAIL_SIZE / Math.max(bitmap.width, bitmap.height);
          const tw = Math.round(bitmap.width * thumbScale);
          const th = Math.round(bitmap.height * thumbScale);
          const canvas = document.createElement("canvas");
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0, tw, th);
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.6);
          const originalUrl = URL.createObjectURL(file);

          let exifData = null;
          if (file.type === "image/jpeg") {
            const buffer = await file.arrayBuffer();
            exifData = await readExif(buffer);
          }

          const imageFile: ImageFile = {
            id,
            file,
            name: file.name,
            originalSize: file.size,
            originalWidth: bitmap.width,
            originalHeight: bitmap.height,
            originalFormat: mimeToFormat(file.type),
            thumbnailUrl,
            originalUrl,
            exifData,
            processedBlob: null,
            processedUrl: null,
            processedSize: null,
            processedWidth: null,
            processedHeight: null,
            overrideFormat: null,
            overrideQuality: null,
            status: "pending",
            error: null,
          };
          bitmap.close();
          return { id, imageFile };
        }),
      );

      for (const { id, imageFile } of prepared) {
        addFile(imageFile);
        enqueueFile(id);
      }
    },
    [addFile, enqueueFile],
  );

  // Global drop handler — works even after files are loaded
  const handleGlobalDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const items = e.dataTransfer.items;
      let files: File[] = [];
      if (items?.length) {
        const entries: FileSystemEntry[] = [];
        for (const item of Array.from(items)) {
          const entry = item.webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
        if (entries.length > 0) {
          const all: File[] = [];
          await readAllFiles(entries, all);
          files = all;
        }
      }
      if (files.length === 0) {
        files = Array.from(e.dataTransfer.files);
      }
      const valid = filterImageFiles(files, fileOrder.length);
      if (valid.length > 0) loadFiles(valid);
    },
    [loadFiles, fileOrder.length],
  );

  // ── Download ──────────────────────────────────────────

  const downloadActive = useCallback(() => {
    if (!activeFile?.processedBlob) return;
    const format = activeFile.overrideFormat ?? outputFormat;
    const ext = formatToExt(format);
    const name = activeFile.name.replace(/\.[^.]+$/, "") + ext;
    const url = URL.createObjectURL(activeFile.processedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }, [activeFile, outputFormat]);

  const downloadAll = useCallback(async () => {
    const state = useImageStore.getState();
    const doneFiles = state.fileOrder
      .map((id) => state.files[id])
      .filter((f) => f?.processedBlob);

    if (doneFiles.length === 0) return;

    if (doneFiles.length === 1) {
      const f = doneFiles[0];
      const format = f.overrideFormat ?? state.outputFormat;
      const ext = formatToExt(format);
      const name = f.name.replace(/\.[^.]+$/, "") + ext;
      const url = URL.createObjectURL(f.processedBlob!);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
      return;
    }

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const f of doneFiles) {
      const format = f.overrideFormat ?? state.outputFormat;
      const ext = formatToExt(format);
      const name = f.name.replace(/\.[^.]+$/, "") + ext;
      zip.file(name, f.processedBlob!);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images.zip";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${doneFiles.length} files as ZIP`);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "o") {
        e.preventDefault();
        openImagePicker(fileOrder.length).then((valid) => {
          if (valid.length > 0) loadFiles(valid);
        });
        return;
      }

      if (mod && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        downloadActive();
        return;
      }

      if (mod && e.shiftKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        downloadAll();
        return;
      }

      if (mod && e.key === "[") {
        e.preventDefault();
        const idx = fileOrder.indexOf(activeFileId ?? "");
        if (idx > 0) setActiveFile(fileOrder[idx - 1]);
        return;
      }

      if (mod && e.key === "]") {
        e.preventDefault();
        const idx = fileOrder.indexOf(activeFileId ?? "");
        if (idx >= 0 && idx < fileOrder.length - 1)
          setActiveFile(fileOrder[idx + 1]);
        return;
      }

      if (e.key === "?") {
        setShowShortcuts(true);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeFileId,
    fileOrder,
    loadFiles,
    downloadActive,
    downloadAll,
    setActiveFile,
  ]);

  // ── Preset handler ────────────────────────────────────

  const handleResizePresetChange = useCallback(
    (presetId: string) => {
      setResizePresetId(presetId);
      const preset = RESIZE_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setResizeDimensions(preset.width, preset.height);
      }
    },
    [setResizePresetId, setResizeDimensions],
  );

  // ── Render ────────────────────────────────────────────

  if (!hydrated) return <FullscreenLoading />;

  if (!hasFiles) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <ImageDropzone onFilesLoad={loadFiles} currentCount={0} />
      </div>
    );
  }

  const totalOriginal = orderedFiles.reduce((s, f) => s + f.originalSize, 0);
  const totalProcessed = orderedFiles.reduce(
    (s, f) => s + (f.processedSize ?? f.originalSize),
    0,
  );
  const totalSavings = computeSavings(totalOriginal, totalProcessed) ?? 0;

  const allPresets: (ImagePreset & { builtin?: boolean })[] = [
    ...BUILTIN_PRESETS.map((p) => ({ ...p, builtin: true })),
    ...customPresets,
  ];

  return (
    <div
      className="flex h-dvh flex-col bg-background"
      onDrop={handleGlobalDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        // Only trigger when leaving the container itself, not children
        if (e.currentTarget === e.target) setIsDraggingOver(false);
      }}
    >
      {/* Drop overlay */}
      {isDraggingOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-dashed border-foreground/30 px-8 py-4 text-sm text-muted-foreground">
            Drop to add images
          </div>
        </div>
      )}

      {/* Navbar */}
      <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground">Image</span>

        <div className="flex-1" />

        {/* Presets */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              Presets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allPresets.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => applyPreset(p)}
                className="text-xs"
              >
                {p.name}
                <span className="ml-auto text-muted-foreground">
                  {p.format.toUpperCase()} {p.quality}%
                </span>
              </DropdownMenuItem>
            ))}
            {customPresets.length > 0 && <DropdownMenuSeparator />}
            {customPresets.map((p) => (
              <DropdownMenuItem
                key={`del-${p.id}`}
                onClick={() => deleteCustomPreset(p.id)}
                className="text-xs text-destructive"
              >
                Delete &ldquo;{p.name}&rdquo;
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setPresetName("");
                setShowPresetDialog(true);
              }}
              className="text-xs"
            >
              Save current settings...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Stats badge */}
        {totalSavings > 0 && (
          <Badge
            variant="secondary"
            className="h-6 text-xs font-normal tabular-nums"
          >
            {formatBytes(totalOriginal)} → {formatBytes(totalProcessed)}
            <span className="ml-1 text-emerald-600 dark:text-emerald-400">
              −{totalSavings}%
            </span>
          </Badge>
        )}

        {/* Download */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <KbdGroup>
                <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={downloadActive}
              disabled={!activeFile?.processedBlob}
            >
              Download current
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={downloadAll}>
              Download all as ZIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add more */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() =>
                openImagePicker(fileOrder.length).then((valid) => {
                  if (valid.length > 0) loadFiles(valid);
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add files</TooltipContent>
        </Tooltip>

        {/* Shortcuts */}
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
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <FileSidebar
          files={orderedFiles}
          activeFileId={activeFileId}
          onSelect={setActiveFile}
          onRemove={removeFile}
          onClearAll={removeAllFiles}
          onAddFiles={loadFiles}
        />

        {/* Editor area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Split view */}
          <SplitView
            originalUrl={activeFile?.originalUrl ?? null}
            processedUrl={activeFile?.processedUrl ?? null}
            originalInfo={
              activeFile
                ? {
                    format: activeFile.originalFormat,
                    size: activeFile.originalSize,
                  }
                : null
            }
            processedInfo={
              activeFile?.processedSize != null
                ? {
                    format: activeFile.overrideFormat ?? outputFormat,
                    size: activeFile.processedSize,
                    width: activeFile.processedWidth!,
                    height: activeFile.processedHeight!,
                  }
                : null
            }
            isProcessing={activeFile?.status === "processing"}
            splitPosition={splitPosition}
            onSplitChange={setSplitPosition}
          />

          {/* Controls */}
          {activeFile && (
            <CompressionControls
              outputFormat={outputFormat}
              qualityMode={qualityMode}
              quality={quality}
              targetSizeKB={targetSizeKB}
              resizeMode={resizeMode}
              resizeWidth={resizeWidth}
              resizeHeight={resizeHeight}
              resizePercent={resizePercent}
              resizePresetId={resizePresetId}
              aspectRatioLocked={aspectRatioLocked}
              stripMetadata={stripMetadata}
              stripGps={stripGps}
              stripCamera={stripCamera}
              keepCopyright={keepCopyright}
              originalWidth={activeFile.originalWidth}
              originalHeight={activeFile.originalHeight}
              exifData={activeFile.exifData}
              onFormatChange={setOutputFormat}
              onQualityModeChange={setQualityMode}
              onQualityChange={setQuality}
              onTargetSizeChange={setTargetSizeKB}
              onResizeModeChange={setResizeMode}
              onResizeDimensionsChange={setResizeDimensions}
              onResizePercentChange={setResizePercent}
              onResizePresetChange={handleResizePresetChange}
              onAspectRatioToggle={toggleAspectRatioLock}
              onStripMetadataChange={setStripMetadata}
              onStripGpsChange={setStripGps}
              onStripCameraChange={setStripCamera}
              onKeepCopyrightChange={setKeepCopyright}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t bg-background px-3 py-1">
        <span className="text-xs text-muted-foreground">
          {activeFile
            ? `${activeFile.originalWidth} × ${activeFile.originalHeight}`
            : "No file selected"}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {orderedFiles.filter((f) => f.status === "done").length}/
          {orderedFiles.length} processed
        </span>
      </div>

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        sections={imageShortcutSections(isMac)}
        maxWidth={384}
      />

      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && presetName.trim()) {
                saveCustomPreset(presetName.trim());
                setShowPresetDialog(false);
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (presetName.trim()) {
                  saveCustomPreset(presetName.trim());
                  setShowPresetDialog(false);
                }
              }}
              disabled={!presetName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
