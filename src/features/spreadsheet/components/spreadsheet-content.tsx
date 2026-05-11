"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpreadsheetStore } from "../store";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { useIsMac } from "@/hooks/use-is-mac";
import { useTheme } from "next-themes";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { spreadsheetShortcutSections } from "./shortcuts";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Keyboard } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SpreadsheetToolbar } from "./spreadsheet-toolbar";
import {
  SpreadsheetContextMenuPortal,
  SheetContextMenuPortal,
} from "./spreadsheet-context-menu";

import { defaultTheme } from "@univerjs/presets";
import "@univerjs/preset-sheets-core/lib/index.css";
import "../spreadsheet.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UniverAPI = any;

// Neutral monochrome theme matching UseTiny design
const neutralTheme: typeof defaultTheme = {
  ...defaultTheme,
  primary: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },
  // Brighter formula reference colors for dark mode readability
  "loop-color": {
    1: "purple.200",
    2: "green.200",
    3: "blue.200",
    4: "yellow.200",
    5: "pink.200",
    6: "jiqing.200",
    7: "orange.200",
    8: "gray.200",
    9: "indigo.200",
    10: "red.200",
    11: "green.100",
    12: "yellow.100",
  },
};

export default function SpreadsheetContent() {
  const setWorkbookData = useSpreadsheetStore((s) => s.setWorkbookData);
  const rehydrated = useStoreHydration(useSpreadsheetStore);
  const { resolvedTheme } = useTheme();
  const isMac = useIsMac();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ctxPosition, setCtxPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [sheetCtxPosition, setSheetCtxPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const univerAPIRef = useRef<UniverAPI>(null);
  const univerInstanceRef = useRef<{ dispose: () => void } | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize Univer
  useEffect(() => {
    if (!rehydrated || !containerRef.current) return;

    let disposed = false;

    async function init() {
      const { createUniver, LocaleType, mergeLocales } =
        await import("@univerjs/presets");
      const { UniverSheetsCorePreset } =
        await import("@univerjs/preset-sheets-core");
      const sheetsCoreEnUS = (
        await import("@univerjs/preset-sheets-core/locales/en-US")
      ).default;

      if (disposed || !containerRef.current) return;

      const isDark = document.documentElement.classList.contains("dark");

      const { univer, univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(sheetsCoreEnUS),
        },
        theme: neutralTheme,
        darkMode: isDark,
        presets: [
          UniverSheetsCorePreset({
            container: containerRef.current,
            contextMenu: false,
          }),
        ],
      });

      if (disposed) {
        queueMicrotask(() => univer.dispose());
        return;
      }

      // Load saved data or create empty workbook
      const state = useSpreadsheetStore.getState();
      if (state.workbookData) {
        univerAPI.createWorkbook(state.workbookData);
      } else {
        univerAPI.createWorkbook({ name: "Spreadsheet" });
      }

      univerAPIRef.current = univerAPI;
      univerInstanceRef.current = univer;
      setReady(true);
    }

    init();

    return () => {
      disposed = true;
      // Defer disposal to avoid unmounting Univer's React root
      // while React is still rendering (strict mode double-mount)
      const instance = univerInstanceRef.current;
      univerInstanceRef.current = null;
      univerAPIRef.current = null;
      if (instance) {
        queueMicrotask(() => instance.dispose());
      }
    };
    // Only run once on mount
  }, [rehydrated]);

  // Custom context menu via native capture listener
  useEffect(() => {
    if (!ready) return;
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Sheet tab right-click
      if (
        target.closest("[data-u=slide-tab-bar]") ||
        target.closest("footer")
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSheetCtxPosition({ x: e.clientX, y: e.clientY });
        setCtxPosition(null);
        return;
      }

      // Grid canvas right-click
      if (target.tagName === "CANVAS") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setCtxPosition({ x: e.clientX, y: e.clientY });
        setSheetCtxPosition(null);
      }
    };

    el.addEventListener("contextmenu", handler, true);
    return () => el.removeEventListener("contextmenu", handler, true);
  }, [ready]);

  useEffect(() => {
    if (!ready || !univerAPIRef.current) return;
    univerAPIRef.current.toggleDarkMode(resolvedTheme === "dark");
  }, [resolvedTheme, ready]);

  // Auto-save workbook snapshot (skip if unchanged to avoid localStorage thrashing)
  const lastSnapshotRef = useRef<string>("");

  useEffect(() => {
    if (!ready || !univerAPIRef.current) return;

    const save = () => {
      const fWorkbook = univerAPIRef.current?.getActiveWorkbook?.();
      if (!fWorkbook) return;
      const snapshot = fWorkbook.save();
      const hash = JSON.stringify(snapshot);
      if (hash === lastSnapshotRef.current) return;
      lastSnapshotRef.current = hash;
      setWorkbookData(snapshot);
    };

    const interval = setInterval(save, 5000);
    const handleBeforeUnload = () => save();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      save();
    };
  }, [ready, setWorkbookData]);

  // Export XLSX
  const handleExportXLSX = useCallback(async () => {
    const api = univerAPIRef.current;
    if (!api) return;

    const fWorkbook = api.getActiveWorkbook();
    if (!fWorkbook) return;

    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const sheets = fWorkbook.getSheets();

    for (const sheet of sheets) {
      const name = sheet.getSheetName();
      const maxRows = sheet.getMaxRows();
      const maxCols = sheet.getMaxColumns();
      const range = sheet.getRange(0, 0, maxRows, maxCols);
      const values = range.getValues();

      // Trim trailing empty rows/cols
      const trimmed = trimData(values);
      const ws = XLSX.utils.aoa_to_sheet(trimmed);
      XLSX.utils.book_append_sheet(wb, ws, name);
    }

    XLSX.writeFile(wb, "spreadsheet.xlsx");
    toast.success("Exported as XLSX");
  }, []);

  // Export CSV (active sheet only)
  const handleExportCSV = useCallback(async () => {
    const api = univerAPIRef.current;
    if (!api) return;

    const fWorkbook = api.getActiveWorkbook();
    if (!fWorkbook) return;

    const sheet = fWorkbook.getActiveSheet();
    if (!sheet) return;

    const XLSX = await import("xlsx");
    const maxRows = sheet.getMaxRows();
    const maxCols = sheet.getMaxColumns();
    const range = sheet.getRange(0, 0, maxRows, maxCols);
    const values = range.getValues();

    const trimmed = trimData(values);
    const ws = XLSX.utils.aoa_to_sheet(trimmed);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheet.getSheetName()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+Shift+E — export
      if (mod && e.shiftKey && e.key === "E") {
        e.preventDefault();
        handleExportXLSX();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExportXLSX]);

  if (!rehydrated) {
    return <FullscreenLoading />;
  }

  return (
    <div className="h-dvh flex flex-col">
      {/* Navbar */}
      <div className="bg-background px-4 py-2 flex items-center gap-2 border-b">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground">Spreadsheet</span>
        <div className="flex-1" />

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
                <Kbd>{isMac ? "⌘" : "Ctrl+"}</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>E</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportXLSX}>
              Export as XLSX
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportCSV}>
              Export current sheet as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

      {/* Custom Toolbar */}
      {ready && <SpreadsheetToolbar univerAPI={univerAPIRef.current} />}

      {/* Spreadsheet */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div ref={containerRef} className="absolute inset-0 spreadsheet-host" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <FullscreenLoading />
          </div>
        )}
      </div>

      {/* Custom context menus */}
      {ctxPosition && ready && (
        <SpreadsheetContextMenuPortal
          univerAPI={univerAPIRef.current}
          position={ctxPosition}
          onClose={() => setCtxPosition(null)}
        />
      )}
      {sheetCtxPosition && ready && (
        <SheetContextMenuPortal
          univerAPI={univerAPIRef.current}
          position={sheetCtxPosition}
          onClose={() => setSheetCtxPosition(null)}
        />
      )}

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        description="Navigate and edit your spreadsheet efficiently."
        sections={spreadsheetShortcutSections(isMac)}
      />
    </div>
  );
}

/** Trim trailing empty rows and columns from a 2D array */
function trimData(
  data: (string | number | boolean | null | undefined)[][],
): (string | number | boolean | null | undefined)[][] {
  if (!data.length) return data;

  // Find last non-empty row
  let lastRow = data.length - 1;
  while (lastRow >= 0 && isRowEmpty(data[lastRow])) lastRow--;
  if (lastRow < 0) return [[""]];

  const trimmed = data.slice(0, lastRow + 1);

  // Find last non-empty column
  let lastCol = 0;
  for (const row of trimmed) {
    for (let c = row.length - 1; c > lastCol; c--) {
      if (row[c] != null && row[c] !== "") {
        lastCol = c;
        break;
      }
    }
  }

  return trimmed.map((row) => row.slice(0, lastCol + 1));
}

function isRowEmpty(
  row: (string | number | boolean | null | undefined)[],
): boolean {
  return row.every((cell) => cell == null || cell === "");
}
