"use client";

import { useCallback, useEffect } from "react";
import { useNotepadStore } from "../store";

export function useKeyboardShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  titleInputRef: React.RefObject<HTMLInputElement | null>,
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
        const index = parseInt(e.key) - 1;
        // Get fresh state directly instead of depending on it
        const state = useNotepadStore.getState();
        const orderedTabs = state.tabOrder
          .map((id) => state.tabs[id])
          .filter(Boolean);
        if (orderedTabs[index]) {
          setActiveTab(orderedTabs[index].id);
        }
      }
      // Navigate to next tab with Cmd/Ctrl + .
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        const state = useNotepadStore.getState();
        const orderedTabs = state.tabOrder
          .map((id) => state.tabs[id])
          .filter(Boolean);
        const currentIndex = orderedTabs.findIndex(
          (tab) => tab.id === state.activeTabId,
        );
        const nextIndex = (currentIndex + 1) % orderedTabs.length;
        if (orderedTabs[nextIndex]) {
          setActiveTab(orderedTabs[nextIndex].id);
        }
      }
      // Navigate to previous tab with Cmd/Ctrl + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        const state = useNotepadStore.getState();
        const orderedTabs = state.tabOrder
          .map((id) => state.tabs[id])
          .filter(Boolean);
        const currentIndex = orderedTabs.findIndex(
          (tab) => tab.id === state.activeTabId,
        );
        const prevIndex =
          currentIndex - 1 < 0 ? orderedTabs.length - 1 : currentIndex - 1;
        if (orderedTabs[prevIndex]) {
          setActiveTab(orderedTabs[prevIndex].id);
        }
      }
      // Focus tab title with F2
      if (e.key === "F2") {
        e.preventDefault();
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }
      // Focus textarea with /
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    },
    [createTab, setActiveTab, textareaRef, titleInputRef],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export { useIsMac } from "@/hooks/use-is-mac";
