"use client";

import { useCallback, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPT_STRING, readAllFiles, filterImageFiles } from "../constants";

interface Props {
  onFilesLoad: (files: File[]) => void;
  currentCount: number;
}

export function ImageDropzone({ onFilesLoad, currentCount }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Try reading entries (supports folder drops)
      const items = e.dataTransfer.items;
      if (items?.length) {
        const entries: FileSystemEntry[] = [];
        for (const item of Array.from(items)) {
          const entry = item.webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
        if (entries.length > 0) {
          const allFiles: File[] = [];
          await readAllFiles(entries, allFiles);
          const valid = filterImageFiles(allFiles, currentCount);
          if (valid.length > 0) {
            onFilesLoad(valid);
            return;
          }
        }
      }

      // Fallback for browsers without webkitGetAsEntry
      const valid = filterImageFiles(
        Array.from(e.dataTransfer.files),
        currentCount,
      );
      if (valid.length > 0) onFilesLoad(valid);
    },
    [onFilesLoad, currentCount],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT_STRING;
    input.multiple = true;
    input.onchange = () => {
      if (!input.files) return;
      const valid = filterImageFiles(Array.from(input.files), currentCount);
      if (valid.length > 0) onFilesLoad(valid);
    };
    input.click();
  }, [onFilesLoad, currentCount]);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "group flex w-full max-w-md cursor-pointer flex-col items-center gap-5 rounded-lg border-2 border-dashed p-10 transition-all duration-150",
          isDragging
            ? "border-foreground/30 bg-accent"
            : "border-border hover:border-foreground/20 hover:bg-accent/50",
        )}
      >
        <ImageUp
          className={cn(
            "h-8 w-8 transition-colors duration-150",
            isDragging
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          strokeWidth={1.5}
        />
        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-semibold tracking-tight">Open images</h2>
          <p className="text-sm text-muted-foreground">
            Drop files or folders here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground/70">
            JPEG, PNG, WebP, AVIF, GIF, SVG, BMP
          </p>
        </div>
        <Button variant="outline" size="sm" className="mt-1">
          Choose Files
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/50">
        Files never leave your browser
      </p>
    </div>
  );
}
