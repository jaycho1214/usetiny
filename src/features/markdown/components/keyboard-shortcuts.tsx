"use client";

import { useCallback, useEffect } from "react";
import type { ViewMode } from "../store";

interface KeyboardShortcutsOptions {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onExport: () => void;
  onShowShortcuts: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onGlobalPaste: (text: string) => void;
}

export function useKeyboardShortcuts({
  textareaRef,
  onExport,
  onShowShortcuts,
  onSetViewMode,
  onGlobalPaste,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const notInInput =
        document.activeElement !== textareaRef.current &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA";

      if (!mod) {
        // /: Focus textarea (when not in an input)
        if (e.key === "/" && notInInput) {
          e.preventDefault();
          textareaRef.current?.focus();
          return;
        }

        // ?: Show shortcuts (when not in an input)
        if (e.key === "?" && notInInput) {
          e.preventDefault();
          onShowShortcuts();
          return;
        }

        return;
      }

      const key = e.key.toLowerCase();

      // Cmd+Shift+E: Export PDF (download)
      if (e.shiftKey && key === "e") {
        e.preventDefault();
        onExport();
        return;
      }

      // Cmd+1/2/3: Switch view mode
      if (e.key === "1") {
        e.preventDefault();
        onSetViewMode("editor");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        onSetViewMode("split");
        return;
      }
      if (e.key === "3") {
        e.preventDefault();
        onSetViewMode("preview");
        return;
      }
    },
    [textareaRef, onExport, onShowShortcuts, onSetViewMode],
  );

  // Global paste: redirect to editor when not focused on an input
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (document.activeElement === textarea) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;

      onGlobalPaste(text);
      textarea.focus();
    },
    [textareaRef, onGlobalPaste],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleKeyDown, handlePaste]);
}
