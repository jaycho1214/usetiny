"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Check,
  Download,
  Eraser,
  FormInput,
  Highlighter,
  Keyboard,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Redo2,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePDFEditorStore } from "../store";
import type { FormFieldType, Tool } from "../types";
import { useIsMac } from "@/hooks/use-is-mac";

interface Props {
  onExport: () => void;
  exporting: boolean;
  onShowShortcuts: () => void;
  onClose: () => void;
}

const editTools: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select", shortcut: "V" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Text", shortcut: "T" },
  { id: "draw", icon: <Pencil className="h-4 w-4" />, label: "Draw", shortcut: "D" },
  { id: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Highlight", shortcut: "H" },
  { id: "form", icon: <FormInput className="h-4 w-4" />, label: "Form", shortcut: "F" },
  { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser", shortcut: "E" },
];

const FORM_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Text Field" },
  { value: "checkbox", label: "Checkbox" },
  { value: "dropdown", label: "Dropdown" },
  { value: "signature", label: "Signature" },
  { value: "date", label: "Date" },
];

const COLORS = [
  "#000000", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#ffffff",
];

function Btn({ children, tooltip, active, className, ...props }: {
  children: React.ReactNode; tooltip: string; active?: boolean; className?: string;
} & React.ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 rounded-md", active && "bg-secondary text-secondary-foreground", className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function PDFToolbar({ onExport, exporting, onShowShortcuts, onClose }: Props) {
  const isMac = useIsMac();
  const mod = isMac ? "\u2318" : "Ctrl+";

  const activeTool = usePDFEditorStore((s) => s.activeTool);
  const setActiveTool = usePDFEditorStore((s) => s.setActiveTool);
  const activeFormType = usePDFEditorStore((s) => s.activeFormType);
  const setActiveFormType = usePDFEditorStore((s) => s.setActiveFormType);
  const drawColor = usePDFEditorStore((s) => s.drawColor);
  const setDrawColor = usePDFEditorStore((s) => s.setDrawColor);
  const drawLineWidth = usePDFEditorStore((s) => s.drawLineWidth);
  const setDrawLineWidth = usePDFEditorStore((s) => s.setDrawLineWidth);
  const textColor = usePDFEditorStore((s) => s.textColor);
  const setTextColor = usePDFEditorStore((s) => s.setTextColor);
  const textFontSize = usePDFEditorStore((s) => s.textFontSize);
  const setTextFontSize = usePDFEditorStore((s) => s.setTextFontSize);
  const textBold = usePDFEditorStore((s) => s.textBold);
  const setTextBold = usePDFEditorStore((s) => s.setTextBold);
  const textItalic = usePDFEditorStore((s) => s.textItalic);
  const setTextItalic = usePDFEditorStore((s) => s.setTextItalic);
  const textFontFamily = usePDFEditorStore((s) => s.textFontFamily);
  const setTextFontFamily = usePDFEditorStore((s) => s.setTextFontFamily);
  const highlightColor = usePDFEditorStore((s) => s.highlightColor);
  const setHighlightColor = usePDFEditorStore((s) => s.setHighlightColor);
  const clearAnnotations = usePDFEditorStore((s) => s.clearAnnotations);
  const undo = usePDFEditorStore((s) => s.undo);
  const redo = usePDFEditorStore((s) => s.redo);
  const canUndo = usePDFEditorStore((s) => s._undoStack.length > 0);
  const canRedo = usePDFEditorStore((s) => s._redoStack.length > 0);
  const sidebarOpen = usePDFEditorStore((s) => s.sidebarOpen);
  const toggleSidebar = usePDFEditorStore((s) => s.toggleSidebar);

  const isFillMode = activeTool === "fill";
  const showColor = !isFillMode && (activeTool === "draw" || activeTool === "text" || activeTool === "highlight");
  const activeColor = activeTool === "draw" ? drawColor : activeTool === "text" ? textColor : highlightColor;
  const setActiveColor = activeTool === "draw" ? setDrawColor : activeTool === "text" ? setTextColor : setHighlightColor;
  const showSize = !isFillMode && (activeTool === "draw" || activeTool === "text");

  const handleModeChange = (mode: string) => {
    if (mode === "fill") setActiveTool("fill");
    else if (activeTool === "fill") setActiveTool("select");
  };

  return (
    <div className="bg-background px-3 py-1.5 flex items-center gap-2">
      {/* Header */}
      <Link href="/" className="text-sm font-semibold transition-opacity hover:opacity-70">
        UseTiny
      </Link>

      {/* Sidebar toggle */}
      <Btn tooltip="Toggle sidebar" onClick={toggleSidebar}>
        {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Btn>

      {/* Mode switcher */}
      <Tabs value={isFillMode ? "fill" : "edit"} onValueChange={handleModeChange}>
        <TabsList className="h-7 p-0.5">
          <TabsTrigger value="edit" className="h-6 px-2.5 text-xs">Edit</TabsTrigger>
          <TabsTrigger value="fill" className="h-6 px-2.5 text-xs">Fill</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Edit mode controls */}
      {!isFillMode && (
        <>
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <Btn tooltip={`Undo (${mod}Z)`} disabled={!canUndo} onClick={undo}>
              <Undo2 className="h-4 w-4" />
            </Btn>
            <Btn tooltip={`Redo (${mod}\u21E7Z)`} disabled={!canRedo} onClick={redo}>
              <Redo2 className="h-4 w-4" />
            </Btn>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-0.5">
            {editTools.map((tool) => (
              <Btn
                key={tool.id}
                tooltip={`${tool.label} (${tool.shortcut})`}
                active={activeTool === tool.id}
                onClick={() => setActiveTool(tool.id)}
              >
                {tool.icon}
              </Btn>
            ))}
          </div>

          {/* Form type dropdown */}
          {activeTool === "form" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
                  {FORM_TYPES.find((f) => f.value === activeFormType)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {FORM_TYPES.map((ft) => (
                  <DropdownMenuItem key={ft.value} onClick={() => setActiveFormType(ft.value)}>
                    {ft.label}
                    {activeFormType === ft.value && <Check className="ml-auto h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Color + size */}
          {showColor && (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent">
                    <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: activeColor }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2.5" align="start">
                  <div className="grid grid-cols-5 gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                          activeColor === c ? "border-foreground scale-110" : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setActiveColor(c)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {showSize && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal tabular-nums text-muted-foreground">
                      {activeTool === "draw" ? `${drawLineWidth}px` : `${textFontSize}pt`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-3" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{activeTool === "draw" ? "Stroke" : "Size"}</span>
                        <span className="text-xs tabular-nums">{activeTool === "draw" ? `${drawLineWidth}px` : `${textFontSize}pt`}</span>
                      </div>
                      <Slider
                        value={[activeTool === "draw" ? drawLineWidth : textFontSize]}
                        onValueChange={([v]) => activeTool === "draw" ? setDrawLineWidth(v) : setTextFontSize(v)}
                        min={activeTool === "draw" ? 1 : 8}
                        max={activeTool === "draw" ? 12 : 72}
                        step={activeTool === "draw" ? 1 : 2}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {/* Text formatting — bold, italic, font family */}
          {activeTool === "text" && (
            <div className="flex items-center gap-0.5">
              <Btn tooltip="Bold" active={textBold} onClick={() => setTextBold(!textBold)}>
                <span className="text-xs font-bold">B</span>
              </Btn>
              <Btn tooltip="Italic" active={textItalic} onClick={() => setTextItalic(!textItalic)}>
                <span className="text-xs italic">I</span>
              </Btn>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal">
                    {textFontFamily === "sans-serif" ? "Sans" : textFontFamily === "serif" ? "Serif" : textFontFamily === "monospace" ? "Mono" : "Cursive"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { value: "sans-serif", label: "Sans Serif" },
                    { value: "serif", label: "Serif" },
                    { value: "monospace", label: "Monospace" },
                    { value: "cursive", label: "Cursive" },
                  ].map((f) => (
                    <DropdownMenuItem key={f.value} onClick={() => setTextFontFamily(f.value)} style={{ fontFamily: f.value }}>
                      {f.label}
                      {textFontFamily === f.value && <Check className="ml-auto h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

        </>
      )}

      {/* Fill mode hint */}
      {isFillMode && (
        <span className="text-xs text-muted-foreground">Click form fields to fill</span>
      )}

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1">
        <Btn tooltip="Shortcuts (?)" onClick={onShowShortcuts}>
          <Keyboard className="h-4 w-4" />
        </Btn>

        {!isFillMode && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <span>
                <Btn tooltip="Clear all" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Btn>
              </span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all annotations?</AlertDialogTitle>
                <AlertDialogDescription>This will remove all annotations from every page. This action can be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAnnotations} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Clear all</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs" onClick={onExport} disabled={exporting}>
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Saving..." : "Export"}
        </Button>

        <Btn tooltip="Close file" onClick={onClose}>
          <X className="h-4 w-4" />
        </Btn>
      </div>
    </div>
  );
}
