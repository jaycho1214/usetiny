"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { formatBytes, computeSavings, openImagePicker } from "../constants";
import type { ImageFile } from "../types";

interface FileSidebarProps {
  files: ImageFile[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onAddFiles: (files: File[]) => void;
}

function StatusIcon({ status }: { status: ImageFile["status"] }) {
  switch (status) {
    case "processing":
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    case "done":
      return <Check className="h-3 w-3 text-emerald-500" />;
    case "error":
      return <X className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
}

export function FileSidebar({
  files,
  activeFileId,
  onSelect,
  onRemove,
  onClearAll,
  onAddFiles,
}: FileSidebarProps) {
  const handleAddClick = useCallback(() => {
    openImagePicker(files.length).then((valid) => {
      if (valid.length > 0) onAddFiles(valid);
    });
  }, [files.length, onAddFiles]);

  return (
    <div className="flex w-48 flex-col border-r bg-background">
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleAddClick}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add files</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear all</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            const savings =
              file.processedSize != null
                ? computeSavings(file.originalSize, file.processedSize)
                : null;

            return (
              <div
                key={file.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(file.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(file.id);
                  }
                }}
                className={cn(
                  "group flex w-full items-start gap-2 rounded-md p-1.5 text-left transition-colors cursor-pointer",
                  isActive ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded border bg-muted">
                  {file.thumbnailUrl && (
                    <img
                      src={file.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  )}
                  <div className="absolute bottom-0 right-0">
                    <StatusIcon status={file.status} />
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{formatBytes(file.originalSize)}</span>
                    {file.processedSize != null && (
                      <>
                        <span>&rarr;</span>
                        <span>{formatBytes(file.processedSize)}</span>
                        {savings !== null && savings > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            −{savings}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Remove */}
                <button
                  className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
