"use client";

import { useCallback, useEffect, type RefObject } from "react";

export interface TabKeyboardSnapshot {
  orderedTabs: { id: string }[];
  currentIndex: number;
  activeTabId: string;
}

interface UseTabKeyboardShortcutsOptions {
  getSnapshot: () => TabKeyboardSnapshot;
  createTab: () => void;
  setActiveTab: (id: string) => void;
  onDeleteTab: (id: string) => void;
  onToggleShortcuts: () => void;
  focusSurface: () => void;
  titleInputRef: RefObject<HTMLInputElement | null>;
}

function isEditableFocused(): boolean {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return true;
  }
  if (el instanceof HTMLElement && el.isContentEditable) {
    return true;
  }
  return false;
}

export function useTabKeyboardShortcuts({
  getSnapshot,
  createTab,
  setActiveTab,
  onDeleteTab,
  onToggleShortcuts,
  focusSurface,
  titleInputRef,
}: UseTabKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        createTab();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const { orderedTabs } = getSnapshot();
        const target = orderedTabs[parseInt(e.key, 10) - 1];
        if (target) setActiveTab(target.id);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        const { orderedTabs, currentIndex } = getSnapshot();
        const nextIndex = (currentIndex + 1) % orderedTabs.length;
        if (orderedTabs[nextIndex]) setActiveTab(orderedTabs[nextIndex].id);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        const { orderedTabs, currentIndex } = getSnapshot();
        const prevIndex =
          currentIndex - 1 < 0 ? orderedTabs.length - 1 : currentIndex - 1;
        if (orderedTabs[prevIndex]) setActiveTab(orderedTabs[prevIndex].id);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        onDeleteTab(getSnapshot().activeTabId);
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
        return;
      }
      if (e.key === "Escape") {
        if (isEditableFocused()) {
          e.preventDefault();
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        if (isEditableFocused()) return;
        const isMdUp = window.matchMedia("(min-width: 768px)").matches;
        const isVertical = e.key === "ArrowUp" || e.key === "ArrowDown";
        if (isMdUp !== isVertical) return;
        e.preventDefault();
        const { orderedTabs, currentIndex } = getSnapshot();
        const isNext = e.key === "ArrowDown" || e.key === "ArrowRight";
        const nextIndex = isNext
          ? (currentIndex + 1) % orderedTabs.length
          : currentIndex - 1 < 0
            ? orderedTabs.length - 1
            : currentIndex - 1;
        if (orderedTabs[nextIndex]) setActiveTab(orderedTabs[nextIndex].id);
        return;
      }
      if (e.key === "?") {
        if (isEditableFocused()) return;
        e.preventDefault();
        onToggleShortcuts();
        return;
      }
      if (e.key === "/" && !isEditableFocused()) {
        e.preventDefault();
        focusSurface();
        return;
      }
    },
    [
      getSnapshot,
      createTab,
      setActiveTab,
      onDeleteTab,
      onToggleShortcuts,
      focusSurface,
      titleInputRef,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
