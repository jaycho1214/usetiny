"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Combine,
  Eraser,
  Grid3X3,
  Italic,
  PaintBucket,
  Redo2,
  Split,
  Strikethrough,
  Type,
  Underline,
  Undo2,
  WrapText,
} from "lucide-react";
import { CMD, COLORS, FONT_FAMILIES, FONT_SIZES, H_ALIGN } from "../commands";
import { useCallback, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UniverAPI = any;

interface SpreadsheetToolbarProps {
  univerAPI: UniverAPI;
}

// ── Primitives ──────────────────────────────────────────

function Btn({
  children,
  tooltip,
  active,
  className,
  ...props
}: {
  children: React.ReactNode;
  tooltip: string;
  active?: boolean;
  className?: string;
} & React.ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-md",
            active && "bg-secondary text-secondary-foreground",
            className,
          )}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function ColorPicker({
  icon,
  tooltip,
  onSelect,
  onReset,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onSelect: (color: string) => void;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
              {icon}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              className="h-5 w-5 rounded-sm border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
            />
          ))}
        </div>
        {onReset && (
          <button
            className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
          >
            Reset
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Start Tab ───────────────────────────────────────────

function StartTab({ exec }: { exec: (cmd: string, params?: unknown) => void }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {/* Clipboard */}
      <Btn tooltip="Undo" onClick={() => exec(CMD.UNDO)}>
        <Undo2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn tooltip="Redo" onClick={() => exec(CMD.REDO)}>
        <Redo2 className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Font Family */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 min-w-[80px] justify-between"
          >
            <span className="truncate">Font</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
          {FONT_FAMILIES.map((f) => (
            <DropdownMenuItem
              key={f}
              className="text-xs"
              style={{ fontFamily: f }}
              onClick={() => exec(CMD.FONT_FAMILY, { value: f })}
            >
              {f}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 min-w-[44px] justify-between"
          >
            <span>11</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
          {FONT_SIZES.map((s) => (
            <DropdownMenuItem
              key={s}
              className="text-xs"
              onClick={() => exec(CMD.FONT_SIZE, { value: s })}
            >
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Text Format */}
      <Btn tooltip="Bold" onClick={() => exec(CMD.BOLD)}>
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn tooltip="Italic" onClick={() => exec(CMD.ITALIC)}>
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn tooltip="Underline" onClick={() => exec(CMD.UNDERLINE)}>
        <Underline className="h-3.5 w-3.5" />
      </Btn>
      <Btn tooltip="Strikethrough" onClick={() => exec(CMD.STRIKETHROUGH)}>
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Color */}
      <ColorPicker
        icon={<Type className="h-3.5 w-3.5" />}
        tooltip="Text color"
        onSelect={(c) => exec(CMD.TEXT_COLOR, { value: c })}
        onReset={() => exec(CMD.RESET_TEXT_COLOR)}
      />
      <ColorPicker
        icon={<PaintBucket className="h-3.5 w-3.5" />}
        tooltip="Fill color"
        onSelect={(c) => exec(CMD.BG_COLOR, { value: c })}
        onReset={() => exec(CMD.RESET_BG_COLOR)}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Alignment */}
      <Btn tooltip="Align left" onClick={() => exec(CMD.H_ALIGN, { value: H_ALIGN.LEFT })}>
        <AlignLeft className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        tooltip="Align center"
        onClick={() => exec(CMD.H_ALIGN, { value: H_ALIGN.CENTER })}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        tooltip="Align right"
        onClick={() => exec(CMD.H_ALIGN, { value: H_ALIGN.RIGHT })}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Btn>
      <Btn tooltip="Wrap text" onClick={() => exec(CMD.TEXT_WRAP)}>
        <WrapText className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Cells */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                <Combine className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Merge cells
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exec(CMD.MERGE_ALL)}>
            Merge all
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exec(CMD.UNMERGE)}>
            Unmerge
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Border */}
      <Btn tooltip="Borders" onClick={() => exec(CMD.BORDER)}>
        <Grid3X3 className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Clear */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                <Eraser className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Clear
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exec(CMD.CLEAR_FORMAT)}>
            Clear formatting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exec(CMD.CLEAR_CONTENT)}>
            Clear content
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => exec(CMD.CLEAR_ALL)}>
            Clear all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Formulas Tab ────────────────────────────────────────

const COMMON_FORMULAS = [
  { name: "SUM", desc: "Sum of values", template: "=SUM()" },
  { name: "AVERAGE", desc: "Average of values", template: "=AVERAGE()" },
  { name: "COUNT", desc: "Count of numbers", template: "=COUNT()" },
  { name: "MAX", desc: "Maximum value", template: "=MAX()" },
  { name: "MIN", desc: "Minimum value", template: "=MIN()" },
  { name: "IF", desc: "Conditional logic", template: "=IF(,,)" },
  { name: "VLOOKUP", desc: "Vertical lookup", template: "=VLOOKUP(,,,)" },
  { name: "CONCATENATE", desc: "Join text", template: "=CONCATENATE(,)" },
  { name: "LEN", desc: "Text length", template: "=LEN()" },
  { name: "ROUND", desc: "Round number", template: "=ROUND(,)" },
  { name: "TODAY", desc: "Current date", template: "=TODAY()" },
  { name: "NOW", desc: "Current date/time", template: "=NOW()" },
];

function FormulasTab({ univerAPI }: { univerAPI: UniverAPI }) {
  const insertFormula = useCallback(
    (template: string) => {
      const wb = univerAPI?.getActiveWorkbook?.();
      if (!wb) return;
      const sheet = wb.getActiveSheet();
      if (!sheet) return;
      // Set the active cell to the formula template
      const selection = sheet.getSelection();
      const range = selection?.getActiveRange();
      if (range) {
        range.setValue(template);
      }
    },
    [univerAPI],
  );

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      <span className="text-xs text-muted-foreground mr-1 shrink-0">
        Insert:
      </span>
      {COMMON_FORMULAS.map((f) => (
        <Tooltip key={f.name}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-7 px-2 text-xs rounded-md"
              onClick={() => insertFormula(f.template)}
            >
              {f.name}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {f.desc}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ── Data Tab ────────────────────────────────────────────

function DataTab({ exec }: { exec: (cmd: string, params?: unknown) => void }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      <Btn tooltip="Merge all cells" onClick={() => exec(CMD.MERGE_ALL)}>
        <Combine className="h-3.5 w-3.5" />
      </Btn>
      <Btn tooltip="Unmerge cells" onClick={() => exec(CMD.UNMERGE)}>
        <Split className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Btn
        tooltip="Clear formatting"
        onClick={() => exec(CMD.CLEAR_FORMAT)}
      >
        <Eraser className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <span className="text-xs text-muted-foreground ml-1">
        Right-click cells for more options
      </span>
    </div>
  );
}

// ── Main Toolbar ────────────────────────────────────────

export function SpreadsheetToolbar({ univerAPI }: SpreadsheetToolbarProps) {
  const exec = useCallback(
    (commandId: string, params?: unknown) => {
      if (!univerAPI) return;
      univerAPI.executeCommand(
        commandId,
        params as Record<string, unknown> | undefined,
      );
    },
    [univerAPI],
  );

  return (
    <Tabs defaultValue="home" className="gap-0">
      <div className="bg-background border-b">
        <div className="flex items-center px-3 pt-1">
          <TabsList variant="line" className="h-7">
            <TabsTrigger value="home" className="h-6 px-2.5 text-xs">
              Home
            </TabsTrigger>
            <TabsTrigger value="insert" className="h-6 px-2.5 text-xs">
              Insert
            </TabsTrigger>
            <TabsTrigger value="view" className="h-6 px-2.5 text-xs">
              View
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="px-3 py-1.5">
          <TabsContent value="home" className="mt-0">
            <StartTab exec={exec} />
          </TabsContent>
          <TabsContent value="insert" className="mt-0">
            <FormulasTab univerAPI={univerAPI} />
          </TabsContent>
          <TabsContent value="view" className="mt-0">
            <DataTab exec={exec} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
