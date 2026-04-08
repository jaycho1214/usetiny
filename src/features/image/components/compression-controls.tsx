"use client";

import { useCallback, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  Unlink,
  RotateCcw,
  Target,
  SlidersHorizontal,
} from "lucide-react";
import { OUTPUT_FORMATS, RESIZE_PRESETS } from "../constants";
import type { ExifData, OutputFormat, QualityMode, ResizeMode } from "../types";
import { cn } from "@/lib/utils";

interface ControlsProps {
  outputFormat: OutputFormat;
  qualityMode: QualityMode;
  quality: number;
  targetSizeKB: number;
  resizeMode: ResizeMode;
  resizeWidth: number | null;
  resizeHeight: number | null;
  resizePercent: number;
  resizePresetId: string | null;
  aspectRatioLocked: boolean;
  stripMetadata: boolean;
  stripGps: boolean;
  stripCamera: boolean;
  keepCopyright: boolean;
  originalWidth: number;
  originalHeight: number;
  exifData: ExifData | null;
  onFormatChange: (f: OutputFormat) => void;
  onQualityModeChange: (m: QualityMode) => void;
  onQualityChange: (q: number) => void;
  onTargetSizeChange: (kb: number) => void;
  onResizeModeChange: (m: ResizeMode) => void;
  onResizeDimensionsChange: (w: number | null, h: number | null) => void;
  onResizePercentChange: (p: number) => void;
  onResizePresetChange: (id: string) => void;
  onAspectRatioToggle: () => void;
  onStripMetadataChange: (v: boolean) => void;
  onStripGpsChange: (v: boolean) => void;
  onStripCameraChange: (v: boolean) => void;
  onKeepCopyrightChange: (v: boolean) => void;
}

export function CompressionControls({
  outputFormat,
  qualityMode,
  quality,
  targetSizeKB,
  resizeMode,
  resizeWidth,
  resizeHeight,
  resizePercent,
  resizePresetId,
  aspectRatioLocked,
  stripMetadata,
  stripGps,
  stripCamera,
  keepCopyright,
  originalWidth,
  originalHeight,
  exifData,
  onFormatChange,
  onQualityModeChange,
  onQualityChange,
  onTargetSizeChange,
  onResizeModeChange,
  onResizeDimensionsChange,
  onResizePercentChange,
  onResizePresetChange,
  onAspectRatioToggle,
  onStripMetadataChange,
  onStripGpsChange,
  onStripCameraChange,
  onKeepCopyrightChange,
}: ControlsProps) {
  const [metadataOpen, setMetadataOpen] = useState(false);

  const handleWidthChange = useCallback(
    (val: string) => {
      const w = val ? parseInt(val) : null;
      if (w !== null && isNaN(w)) return;
      if (aspectRatioLocked && w && originalWidth > 0) {
        const ratio = originalHeight / originalWidth;
        onResizeDimensionsChange(w, Math.round(w * ratio));
      } else {
        onResizeDimensionsChange(w, resizeHeight);
      }
    },
    [
      aspectRatioLocked,
      originalWidth,
      originalHeight,
      resizeHeight,
      onResizeDimensionsChange,
    ],
  );

  const handleHeightChange = useCallback(
    (val: string) => {
      const h = val ? parseInt(val) : null;
      if (h !== null && isNaN(h)) return;
      if (aspectRatioLocked && h && originalHeight > 0) {
        const ratio = originalWidth / originalHeight;
        onResizeDimensionsChange(Math.round(h * ratio), h);
      } else {
        onResizeDimensionsChange(resizeWidth, h);
      }
    },
    [
      aspectRatioLocked,
      originalWidth,
      originalHeight,
      resizeWidth,
      onResizeDimensionsChange,
    ],
  );

  const isLossless = outputFormat === "png";

  return (
    <div className="border-t bg-background">
      <div className="flex items-stretch divide-x overflow-x-auto">
        {/* ── Format ── */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Format
          </span>
          <Select
            value={outputFormat}
            onValueChange={(v) => onFormatChange(v as OutputFormat)}
          >
            <SelectTrigger size="sm" className="w-24 h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTPUT_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Quality / Target Size ── */}
        <div className="flex items-center gap-3 px-4 py-2.5 min-w-[280px]">
          <ToggleGroup
            type="single"
            value={qualityMode}
            onValueChange={(v) => {
              if (v) onQualityModeChange(v as QualityMode);
            }}
            size="sm"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="manual"
                  className="h-6 w-6 p-0"
                  disabled={isLossless}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Manual quality</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="target"
                  className="h-6 w-6 p-0"
                  disabled={isLossless}
                >
                  <Target className="h-3 w-3" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Target file size</TooltipContent>
            </Tooltip>
          </ToggleGroup>

          {qualityMode === "manual" ? (
            <div className="flex items-center gap-2 flex-1">
              <Slider
                value={[isLossless ? 100 : quality]}
                min={1}
                max={100}
                step={1}
                disabled={isLossless}
                onValueChange={([v]) => onQualityChange(v)}
                className={cn("flex-1 min-w-[100px]", isLossless && "opacity-40")}
              />
              <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">
                {isLossless ? "—" : quality}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                type="number"
                min={1}
                value={targetSizeKB}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v > 0) onTargetSizeChange(v);
                }}
                className="h-7 w-20 px-2 text-xs tabular-nums"
                disabled={isLossless}
              />
              <span className="text-xs text-muted-foreground">KB</span>
            </div>
          )}
        </div>

        {/* ── Resize ── */}
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Resize
          </span>
          <ToggleGroup
            type="single"
            value={resizeMode}
            onValueChange={(v) => {
              if (v) onResizeModeChange(v as ResizeMode);
            }}
            size="sm"
          >
            <ToggleGroupItem value="none" className="text-xs px-2 h-6">
              Off
            </ToggleGroupItem>
            <ToggleGroupItem value="exact" className="text-xs px-2 h-6">
              Exact
            </ToggleGroupItem>
            <ToggleGroupItem value="percentage" className="text-xs px-2 h-6">
              %
            </ToggleGroupItem>
            <ToggleGroupItem value="preset" className="text-xs px-2 h-6">
              Preset
            </ToggleGroupItem>
          </ToggleGroup>

          {resizeMode === "exact" && (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="W"
                value={resizeWidth ?? ""}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="h-7 w-14 px-1.5 text-xs tabular-nums text-center"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onAspectRatioToggle}
                  >
                    {aspectRatioLocked ? (
                      <LinkIcon className="h-3 w-3" />
                    ) : (
                      <Unlink className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {aspectRatioLocked
                    ? "Unlock aspect ratio"
                    : "Lock aspect ratio"}
                </TooltipContent>
              </Tooltip>
              <Input
                type="number"
                placeholder="H"
                value={resizeHeight ?? ""}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="h-7 w-14 px-1.5 text-xs tabular-nums text-center"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      onResizeDimensionsChange(originalWidth, originalHeight)
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to original</TooltipContent>
              </Tooltip>
            </div>
          )}

          {resizeMode === "percentage" && (
            <div className="flex items-center gap-2">
              <Slider
                value={[resizePercent]}
                min={1}
                max={200}
                step={1}
                onValueChange={([v]) => onResizePercentChange(v)}
                className="w-24"
              />
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                {resizePercent}%
              </span>
            </div>
          )}

          {resizeMode === "preset" && (
            <Select
              value={resizePresetId ?? ""}
              onValueChange={onResizePresetChange}
            >
              <SelectTrigger size="sm" className="w-44 h-7">
                <SelectValue placeholder="Choose size..." />
              </SelectTrigger>
              <SelectContent>
                {RESIZE_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ── Metadata ── */}
        {exifData && (
          <div className="relative px-4 py-2.5">
            <button
              className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              onClick={() => setMetadataOpen(!metadataOpen)}
            >
              Metadata
              {metadataOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            {metadataOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md z-50">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs mb-3">
                  {exifData.make && (
                    <>
                      <span className="text-muted-foreground">Camera</span>
                      <span>
                        {exifData.make} {exifData.model}
                      </span>
                    </>
                  )}
                  {exifData.dateTaken && (
                    <>
                      <span className="text-muted-foreground">Date</span>
                      <span>{exifData.dateTaken}</span>
                    </>
                  )}
                  {exifData.gpsLatitude != null && (
                    <>
                      <span className="text-muted-foreground">GPS</span>
                      <span>
                        {exifData.gpsLatitude}, {exifData.gpsLongitude}
                      </span>
                    </>
                  )}
                  {exifData.iso && (
                    <>
                      <span className="text-muted-foreground">ISO</span>
                      <span>{exifData.iso}</span>
                    </>
                  )}
                  {exifData.aperture && (
                    <>
                      <span className="text-muted-foreground">Aperture</span>
                      <span>{exifData.aperture}</span>
                    </>
                  )}
                  {exifData.shutterSpeed && (
                    <>
                      <span className="text-muted-foreground">Shutter</span>
                      <span>{exifData.shutterSpeed}</span>
                    </>
                  )}
                  {exifData.focalLength && (
                    <>
                      <span className="text-muted-foreground">Focal</span>
                      <span>{exifData.focalLength}</span>
                    </>
                  )}
                </div>

                <Separator className="mb-3" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Strip all</Label>
                    <Switch
                      size="sm"
                      checked={stripMetadata}
                      onCheckedChange={onStripMetadataChange}
                    />
                  </div>
                  {!stripMetadata && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Strip GPS</Label>
                        <Switch
                          size="sm"
                          checked={stripGps}
                          onCheckedChange={onStripGpsChange}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Strip camera</Label>
                        <Switch
                          size="sm"
                          checked={stripCamera}
                          onCheckedChange={onStripCameraChange}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Keep copyright</Label>
                        <Switch
                          size="sm"
                          checked={keepCopyright}
                          onCheckedChange={onKeepCopyrightChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
