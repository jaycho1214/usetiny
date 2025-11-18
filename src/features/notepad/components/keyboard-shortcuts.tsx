"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotepadStore } from "../store";

export function useKeyboardShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
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
      // Focus textarea with /
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    },
    [createTab, setActiveTab, textareaRef],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

interface NavigatorWithUserAgentData {
  userAgentData?: {
    platform?: string;
  };
  platform?: string;
}

export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Try modern API first, fallback to deprecated platform
    const nav = navigator as NavigatorWithUserAgentData;
    if (nav.userAgentData?.platform) {
      setIsMac(nav.userAgentData.platform.toLowerCase().includes("mac"));
    } else if (nav.platform) {
      // Fallback to deprecated platform API for older browsers
      setIsMac(nav.platform.toLowerCase().includes("mac"));
    }
  }, []);

  // Return false until mounted to match SSR
  return isMac;
}
