"use client";

import { useCallback, useEffect } from "react";
import { type QRType } from "../utils";

const qrTypeOrder: QRType[] = [
  "text",
  "url",
  "wifi",
  "email",
  "phone",
  "sms",
  "bitcoin",
];

export function useKeyboardShortcuts(
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  onDownload: () => void,
  onCopy: () => void,
  onShowShortcuts: () => void,
  setQRType: (type: QRType) => void,
  onClear: () => void,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Switch QR type with Cmd/Ctrl + 1-7
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (qrTypeOrder[index]) {
          setQRType(qrTypeOrder[index]);
        }
        return;
      }

      // Download QR code with Cmd/Ctrl + D
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        onDownload();
        return;
      }

      // Copy QR code with Cmd/Ctrl + C (only when not in input)
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        const activeEl = document.activeElement;
        const isInput =
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement;
        const hasSelection =
          isInput && activeEl.selectionStart !== activeEl.selectionEnd;

        // Only intercept if not selecting text in input
        if (!hasSelection) {
          e.preventDefault();
          onCopy();
        }
        return;
      }

      // Clear input with Cmd/Ctrl + L
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        onClear();
        inputRef.current?.focus();
        return;
      }

      // Focus input with /
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Show shortcuts with ?
      if (e.key === "?" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        onShowShortcuts();
        return;
      }
    },
    [inputRef, onClear, setQRType, onDownload, onCopy, onShowShortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export { useIsMac } from "@/hooks/use-is-mac";
