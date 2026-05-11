"use client";

import { useCallback, useEffect } from "react";
import { useRichTextStore } from "../store";
import type { EditorHandle } from "./editor";

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

function getTabNavigation() {
  const state = useRichTextStore.getState();
  const orderedTabs = state.tabOrder
    .map((id) => state.tabs[id])
    .filter(Boolean);
  const currentIndex = orderedTabs.findIndex(
    (tab) => tab.id === state.activeTabId,
  );
  return { orderedTabs, currentIndex };
}

export function useKeyboardShortcuts(
  editorRef: React.RefObject<EditorHandle | null>,
  titleInputRef: React.RefObject<HTMLInputElement | null>,
  onToggleShortcuts: () => void,
  onDeleteTab: (id: string) => void,
) {
  const createTab = useRichTextStore((state) => state.createTab);
  const setActiveTab = useRichTextStore((state) => state.setActiveTab);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Create new tab with Cmd/Ctrl + K (overrides Tiptap link)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        createTab();
        return;
      }
      // Switch tab with Cmd/Ctrl + 1..9
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const { orderedTabs } = getTabNavigation();
        const target = orderedTabs[parseInt(e.key, 10) - 1];
        if (target) setActiveTab(target.id);
        return;
      }
      // Next tab with Cmd/Ctrl + .
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        const { orderedTabs, currentIndex } = getTabNavigation();
        const nextIndex = (currentIndex + 1) % orderedTabs.length;
        if (orderedTabs[nextIndex]) setActiveTab(orderedTabs[nextIndex].id);
        return;
      }
      // Previous tab with Cmd/Ctrl + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        const { orderedTabs, currentIndex } = getTabNavigation();
        const prevIndex =
          currentIndex - 1 < 0 ? orderedTabs.length - 1 : currentIndex - 1;
        if (orderedTabs[prevIndex]) setActiveTab(orderedTabs[prevIndex].id);
        return;
      }
      // Delete current tab with Cmd/Ctrl + Shift + Backspace
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        onDeleteTab(useRichTextStore.getState().activeTabId);
        return;
      }
      // Focus tab title with F2
      if (e.key === "F2") {
        e.preventDefault();
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
        return;
      }
      // Unfocus active input/editor with Escape
      if (e.key === "Escape") {
        if (isEditableFocused()) {
          e.preventDefault();
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
      // Arrow key tab navigation when nothing is focused
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
        const { orderedTabs, currentIndex } = getTabNavigation();
        const isNext = e.key === "ArrowDown" || e.key === "ArrowRight";
        const nextIndex = isNext
          ? (currentIndex + 1) % orderedTabs.length
          : currentIndex - 1 < 0
            ? orderedTabs.length - 1
            : currentIndex - 1;
        if (orderedTabs[nextIndex]) setActiveTab(orderedTabs[nextIndex].id);
        return;
      }
      // Show shortcuts dialog with ?
      if (e.key === "?") {
        if (isEditableFocused()) return;
        e.preventDefault();
        onToggleShortcuts();
        return;
      }
      // Focus editor with / when nothing is focused (otherwise Tiptap opens slash menu)
      if (e.key === "/" && !isEditableFocused()) {
        e.preventDefault();
        editorRef.current?.focus();
        return;
      }
    },
    [
      createTab,
      setActiveTab,
      editorRef,
      titleInputRef,
      onToggleShortcuts,
      onDeleteTab,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export { useIsMac } from "@/hooks/use-is-mac";
