"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBytes, computeSavings } from "../constants";
import { GripVertical } from "lucide-react";

interface SplitViewProps {
  originalUrl: string | null;
  processedUrl: string | null;
  originalInfo: { format: string; size: number } | null;
  processedInfo: {
    format: string;
    size: number;
    width: number;
    height: number;
  } | null;
  isProcessing: boolean;
  splitPosition: number;
  onSplitChange: (pos: number) => void;
}

export function SplitView({
  originalUrl,
  processedUrl,
  originalInfo,
  processedInfo,
  isProcessing,
  splitPosition,
  onSplitChange,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      // Calculate initial position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        onSplitChange(Math.max(2, Math.min(98, percent)));
      }
    },
    [onSplitChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      onSplitChange(Math.max(2, Math.min(98, percent)));
    },
    [isDragging, onSplitChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Arrow key support for the divider
  useEffect(() => {
    if (!isDragging) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onSplitChange(Math.max(2, splitPosition - 1));
      } else if (e.key === "ArrowRight") {
        onSplitChange(Math.min(98, splitPosition + 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDragging, splitPosition, onSplitChange]);

  if (!originalUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Select an image to compare
      </div>
    );
  }

  const savings =
    originalInfo && processedInfo
      ? computeSavings(originalInfo.size, processedInfo.size)
      : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-hidden select-none",
        // Checkerboard for transparency
        "bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0]",
        "[background-image:linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))_75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))_75%)]",
      )}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Before (original) — full area, clipped from right */}
      <img
        src={originalUrl}
        alt="Original"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
        draggable={false}
      />

      {/* After (processed) — full area, clipped from left */}
      {processedUrl && (
        <img
          src={processedUrl}
          alt="Processed"
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
          draggable={false}
        />
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
        >
          <div className="rounded-md bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            Processing...
          </div>
        </div>
      )}

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-10 w-px bg-white/70 pointer-events-none"
        style={{ left: `${splitPosition}%` }}
      />

      {/* Draggable handle */}
      <div
        className={cn(
          "absolute top-1/2 z-20 -translate-y-1/2 -translate-x-1/2",
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-background border shadow-md cursor-ew-resize touch-none",
          "transition-transform",
          isDragging && "scale-110",
        )}
        style={{ left: `${splitPosition}%` }}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-label="Comparison divider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(splitPosition)}
        tabIndex={0}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Labels */}
      {originalInfo && (
        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm text-xs font-normal"
          >
            {originalInfo.format.toUpperCase()} &middot;{" "}
            {formatBytes(originalInfo.size)}
          </Badge>
        </div>
      )}
      {processedInfo && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm text-xs font-normal"
          >
            {processedInfo.format.toUpperCase()} &middot;{" "}
            {formatBytes(processedInfo.size)}
            {savings !== null && savings > 0 && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                −{savings}%
              </span>
            )}
            {savings !== null && savings < 0 && (
              <span className="ml-1 text-red-500">
                +{Math.abs(savings)}%
              </span>
            )}
          </Badge>
        </div>
      )}
    </div>
  );
}
