"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardCopy,
  ClipboardPaste,
  Columns3,
  Combine,
  Copy,
  Eraser,
  FilePlus,
  Pencil,
  Rows3,
  Scissors,
  Split,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CMD } from "../commands";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UniverAPI = any;

interface MenuPosition {
  x: number;
  y: number;
}

// ── Shared primitives ───────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={onClick}
    >
      {Icon ? (
        <Icon className="h-4 w-4 text-muted-foreground" />
      ) : (
        <span className="w-4" />
      )}
      <span>{label}</span>
      {shortcut && (
        <span className="ml-auto text-xs text-muted-foreground">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-border" />;
}

function SubMenu({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-default">
        {Icon ? (
          <Icon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="w-4" />
        )}
        <span>{label}</span>
        <span className="ml-auto text-xs text-muted-foreground">›</span>
      </div>
      {open && (
        <div className="absolute left-full top-0 ml-1 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Shared hooks ────────────────────────────────────────

/** Dismiss menu on outside click, scroll, or Escape. */
function useMenuDismiss(
  menuRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const handlePointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleScroll = () => onClose();

    document.addEventListener("mousedown", handlePointer, true);
    document.addEventListener("click", handlePointer, true);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer, true);
      document.removeEventListener("click", handlePointer, true);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuRef, onClose]);
}

/** Clamp menu position so it stays within the viewport. */
function useViewportClamp(
  menuRef: React.RefObject<HTMLDivElement | null>,
  position: MenuPosition,
) {
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nx = position.x + rect.width > vw ? vw - rect.width - 8 : position.x;
    const ny =
      position.y + rect.height > vh
        ? Math.max(8, position.y - rect.height)
        : position.y;
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
  }, [menuRef, position]);
}

// ── Cell context menu ───────────────────────────────────

export function SpreadsheetContextMenuPortal({
  univerAPI,
  position,
  onClose,
}: {
  univerAPI: UniverAPI;
  position: MenuPosition;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useViewportClamp(menuRef, position);
  useMenuDismiss(menuRef, onClose);

  const exec = useCallback(
    (commandId: string) => {
      if (!univerAPI) return;
      univerAPI.executeCommand(commandId);
      onClose();
    },
    [univerAPI, onClose],
  );

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[200px] max-h-[80vh] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
      )}
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem
        icon={ClipboardCopy}
        label="Copy"
        shortcut="⌘C"
        onClick={() => exec(CMD.COPY)}
      />
      <MenuItem
        icon={Scissors}
        label="Cut"
        shortcut="⌘X"
        onClick={() => exec(CMD.CUT)}
      />
      <MenuItem
        icon={ClipboardPaste}
        label="Paste"
        shortcut="⌘V"
        onClick={() => exec(CMD.PASTE)}
      />

      <MenuSeparator />

      <SubMenu icon={Rows3} label="Insert rows">
        <MenuItem
          label="Row above"
          onClick={() => exec(CMD.INSERT_ROW_BEFORE)}
        />
        <MenuItem
          label="Row below"
          onClick={() => exec(CMD.INSERT_ROW_AFTER)}
        />
      </SubMenu>
      <SubMenu icon={Columns3} label="Insert columns">
        <MenuItem
          label="Column left"
          onClick={() => exec(CMD.INSERT_COL_BEFORE)}
        />
        <MenuItem
          label="Column right"
          onClick={() => exec(CMD.INSERT_COL_AFTER)}
        />
      </SubMenu>

      <MenuSeparator />

      <MenuItem
        icon={Trash2}
        label="Delete row"
        onClick={() => exec(CMD.REMOVE_ROW)}
      />
      <MenuItem
        icon={Trash2}
        label="Delete column"
        onClick={() => exec(CMD.REMOVE_COL)}
      />

      <MenuSeparator />

      <MenuItem
        icon={Combine}
        label="Merge cells"
        onClick={() => exec(CMD.MERGE_ALL)}
      />
      <MenuItem
        icon={Split}
        label="Unmerge cells"
        onClick={() => exec(CMD.UNMERGE)}
      />

      <MenuSeparator />

      <SubMenu icon={Eraser} label="Clear">
        <MenuItem
          label="Clear content"
          onClick={() => exec(CMD.CLEAR_CONTENT)}
        />
        <MenuItem
          label="Clear formatting"
          onClick={() => exec(CMD.CLEAR_FORMAT)}
        />
        <MenuSeparator />
        <MenuItem label="Clear all" onClick={() => exec(CMD.CLEAR_ALL)} />
      </SubMenu>
    </div>
  );
}

// ── Sheet tab context menu ──────────────────────────────

export function SheetContextMenuPortal({
  univerAPI,
  position,
  onClose,
}: {
  univerAPI: UniverAPI;
  position: MenuPosition;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useViewportClamp(menuRef, position);
  useMenuDismiss(menuRef, onClose);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getWorkbook = useCallback(() => {
    return univerAPI?.getActiveWorkbook?.();
  }, [univerAPI]);

  const handleRename = useCallback(() => {
    // Trigger Univer's inline rename on the active sheet tab
    univerAPI?.executeCommand?.(CMD.RENAME_SHEET);
    onClose();
  }, [univerAPI, onClose]);

  const handleDuplicate = useCallback(() => {
    const wb = getWorkbook();
    if (!wb) return;
    const sheet = wb.getActiveSheet();
    if (sheet) wb.duplicateSheet(sheet);
    onClose();
  }, [getWorkbook, onClose]);

  const handleNewSheet = useCallback(() => {
    const wb = getWorkbook();
    if (!wb) return;
    const count = wb.getSheets().length;
    wb.insertSheet(`Sheet${count + 1}`);
    onClose();
  }, [getWorkbook, onClose]);

  const handleDelete = useCallback(() => {
    const wb = getWorkbook();
    if (!wb) return;
    const sheets = wb.getSheets();
    if (sheets.length <= 1) return; // Don't delete the last sheet
    wb.deleteActiveSheet();
    onClose();
  }, [getWorkbook, onClose]);

  if (confirmDelete) {
    return (
      <div
        ref={menuRef}
        className={cn(
          "fixed z-[9999] w-[240px] rounded-md border bg-popover p-3 text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95",
        )}
        style={{ left: position.x, top: position.y }}
      >
        <p className="text-sm font-medium mb-1">Delete this sheet?</p>
        <p className="text-xs text-muted-foreground mb-3">
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
            onClick={() => {
              setConfirmDelete(false);
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
      )}
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem icon={Pencil} label="Rename" onClick={handleRename} />
      <MenuItem icon={Copy} label="Duplicate" onClick={handleDuplicate} />
      <MenuItem icon={FilePlus} label="New sheet" onClick={handleNewSheet} />
      <MenuSeparator />
      <MenuItem
        icon={Trash2}
        label="Delete sheet"
        onClick={() => setConfirmDelete(true)}
      />
    </div>
  );
}
