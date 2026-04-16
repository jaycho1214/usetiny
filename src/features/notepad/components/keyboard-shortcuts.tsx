"use client";

import { useCallback, useEffect } from "react";
import { useNotepadStore } from "../store";

function isEditableFocused(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function getTabNavigation() {
  const state = useNotepadStore.getState();
  const orderedTabs = state.tabOrder
    .map((id) => state.tabs[id])
    .filter(Boolean);
  const currentIndex = orderedTabs.findIndex(
    (tab) => tab.id === state.activeTabId,
  );
  return { orderedTabs, currentIndex };
}

export function useKeyboardShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  titleInputRef: React.RefObject<HTMLInputElement | null>,
  onToggleShortcuts: () => void,
  onDeleteTab: (id: string) => void,
) {
  const createTab = useNotepadStore((state) => state.createTab);
  const setActiveTab = useNotepadStore((state) => state.setActiveTab);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Create new tab with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        createTab();
        return;
      }
      // Tab switching with Cmd/Ctrl + number
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const { orderedTabs } = getTabNavigation();
        if (orderedTabs[parseInt(e.key) - 1]) {
          setActiveTab(orderedTabs[parseInt(e.key) - 1].id);
        }
      }
      // Navigate to next tab with Cmd/Ctrl + .
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        const { orderedTabs, currentIndex } = getTabNavigation();
        const nextIndex = (currentIndex + 1) % orderedTabs.length;
        if (orderedTabs[nextIndex]) {
          setActiveTab(orderedTabs[nextIndex].id);
        }
      }
      // Navigate to previous tab with Cmd/Ctrl + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        const { orderedTabs, currentIndex } = getTabNavigation();
        const prevIndex =
          currentIndex - 1 < 0 ? orderedTabs.length - 1 : currentIndex - 1;
        if (orderedTabs[prevIndex]) {
          setActiveTab(orderedTabs[prevIndex].id);
        }
      }
      // Delete current tab with Cmd/Ctrl + Shift + Backspace
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        onDeleteTab(useNotepadStore.getState().activeTabId);
        return;
      }
      // Focus tab title with F2
      if (e.key === "F2") {
        e.preventDefault();
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }
      // Unfocus active input/textarea with Escape
      if (e.key === "Escape") {
        if (isEditableFocused()) {
          e.preventDefault();
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
      // Up/Down for sidebar (md+), Left/Right for horizontal tabs (< md)
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
        if (orderedTabs[nextIndex]) {
          setActiveTab(orderedTabs[nextIndex].id);
        }
        return;
      }
      // Toggle shortcuts help with ? when unfocused
      if (e.key === "?") {
        if (isEditableFocused()) return;
        e.preventDefault();
        onToggleShortcuts();
        return;
      }
      // Focus textarea with /
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    },
    [
      createTab,
      setActiveTab,
      textareaRef,
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
