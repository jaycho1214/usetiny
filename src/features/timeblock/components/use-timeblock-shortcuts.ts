"use client";

import { useEffect, useRef } from "react";

export interface TimeblockShortcutHandlers {
  onToday: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/** Popover/dialog content, where focus sits on the editor's own controls. */
const LAYER = "[role=dialog],[role=alertdialog],[role=menu],[role=listbox]";
/** Menus and listboxes, where a letter key is typeahead. */
const MENU = "[role=menu],[role=listbox]";

function isInside(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

/**
 * Page-level shortcuts. Ignored while typing so inputs keep native undo;
 * undo/redo are also ignored in menus, and navigation keys in any layer.
 */
export function useTimeblockShortcuts(handlers: TimeblockShortcutHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditable(e.target)) return;
      const h = latest.current;
      const key = e.key.toLowerCase();
      const inMenu = isInside(e.target, MENU);
      if ((e.metaKey || e.ctrlKey) && key === "z") {
        if (inMenu) return;
        e.preventDefault();
        if (e.shiftKey) h.onRedo();
        else h.onUndo();
        return;
      }
      if (e.ctrlKey && !e.metaKey && key === "y") {
        if (inMenu) return;
        e.preventDefault();
        h.onRedo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isInside(e.target, LAYER)) return;
      if (e.key === "?") h.onShowShortcuts();
      else if (key === "t") h.onToday();
      else if (e.key === "[") h.onPrevWeek();
      else if (e.key === "]") h.onNextWeek();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
