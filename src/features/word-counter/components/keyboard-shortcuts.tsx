"use client";

import { useCallback, useEffect } from "react";

export function useKeyboardShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  onShowShortcuts: () => void,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isInTextarea = document.activeElement === textareaRef.current;

      // ? — show shortcuts dialog (only when not typing)
      if (e.key === "?" && !isInTextarea) {
        e.preventDefault();
        onShowShortcuts();
        return;
      }

      // / — focus textarea (only when not already focused)
      if (e.key === "/" && !isInTextarea) {
        e.preventDefault();
        textareaRef.current?.focus();
        return;
      }

      // Escape — unfocus textarea
      if (e.key === "Escape" && isInTextarea) {
        e.preventDefault();
        textareaRef.current?.blur();
      }
    },
    [textareaRef, onShowShortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
