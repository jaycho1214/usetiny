"use client";

import { useMarkdownStore } from "../store";
import type { PageSize, Orientation, Margins } from "../store";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const pageSizes: { value: PageSize; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
];

const orientations: { value: Orientation; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const margins: { value: Margins; label: string }[] = [
  { value: "narrow", label: "Narrow" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
];

export function ExportSettings() {
  const { exportSettings, updateExportSettings } = useMarkdownStore();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline" className="h-7 w-7">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Export settings</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Export Settings</h4>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Page size</label>
            <ButtonGroup className="w-full">
              {pageSizes.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={
                    exportSettings.pageSize === value ? "default" : "outline"
                  }
                  onClick={() => updateExportSettings({ pageSize: value })}
                  className="h-7 flex-1 text-xs"
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Orientation
            </label>
            <ButtonGroup className="w-full">
              {orientations.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={
                    exportSettings.orientation === value ? "default" : "outline"
                  }
                  onClick={() => updateExportSettings({ orientation: value })}
                  className="h-7 flex-1 text-xs"
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Margins</label>
            <ButtonGroup className="w-full">
              {margins.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={
                    exportSettings.margins === value ? "default" : "outline"
                  }
                  onClick={() => updateExportSettings({ margins: value })}
                  className="h-7 flex-1 text-xs"
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Page numbers
            </label>
            <Switch
              checked={exportSettings.pageNumbers}
              onCheckedChange={(v) => updateExportSettings({ pageNumbers: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Header & footer
            </label>
            <Switch
              checked={exportSettings.headerFooter}
              onCheckedChange={(v) =>
                updateExportSettings({ headerFooter: v })
              }
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
