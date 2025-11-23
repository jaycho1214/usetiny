"use client";

import { useNotepadStore } from "../store";
import { useIsMac, useKeyboardShortcuts } from "./keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Keyboard, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { TabTitleInput } from "./tab-title-input";

export default function NotepadContent() {
  const {
    tabs,
    tabOrder,
    activeTabId,
    createTab,
    deleteTab,
    updateTab,
    setActiveTab,
  } = useNotepadStore();

  const isMac = useIsMac();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const prevActiveTabIdRef = useRef<string | null>(activeTabId);

  useKeyboardShortcuts(textareaRef, titleInputRef);
  const rehydrated = useStoreHydration(useNotepadStore);

  // Auto-delete empty tabs when switching
  useEffect(() => {
    const prevTabId = prevActiveTabIdRef.current;
    const currentTabId = activeTabId;

    // If we switched tabs and there was a previous tab
    if (prevTabId && prevTabId !== currentTabId && tabs[prevTabId]) {
      const prevTab = tabs[prevTabId];
      // Check if previous tab's content is empty (title doesn't matter)
      if (prevTab.content.trim() === "") {
        deleteTab(prevTabId);
      }
    }

    // Update ref to current tab
    prevActiveTabIdRef.current = currentTabId;
  }, [activeTabId, tabs, deleteTab]);

  if (!rehydrated) {
    return <FullscreenLoading />;
  }

  // Compute derived values from state
  const orderedTabs = tabOrder
    .map((id) => tabs[id])
    .filter((tab): tab is import("../store").NotepadTab => Boolean(tab));
  const activeTab = tabs[activeTabId] || orderedTabs[0] || null;

  return (
    <div className="h-dvh flex flex-col">
      {/* Navbar */}
      <div className="bg-background px-4 py-2 flex items-center gap-2">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {orderedTabs.map((tab, index) => (
            <div
              key={tab.id}
              className={cn(
                "h-7 px-2 gap-1.5 relative inline-flex items-center rounded-md text-sm font-medium transition-colors cursor-pointer",
                tab.id === activeTabId
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabTitleInput
                tabId={tab.id}
                title={tab.title}
                index={index}
                isActive={tab.id === activeTabId}
                isMac={isMac}
                titleInputRef={titleInputRef}
                textareaRef={textareaRef}
                onTitleChange={(id, title) => updateTab(id, { title })}
                onDelete={deleteTab}
              />
            </div>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowShortcuts(true)}
              className="h-7 w-7"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={createTab}
              className="h-7 w-7"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <KbdGroup>
              <Kbd>{isMac ? "⌘" : "Ctrl+"}</Kbd>
              <span>+</span>
              <Kbd>K</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Textarea */}
      {activeTab && (
        <textarea
          ref={textareaRef}
          value={activeTab.content}
          onChange={(e) => {
            const newValue = e.target.value;
            // Limit to 1MB of text per tab to prevent localStorage exhaustion
            if (newValue.length <= 1000000) {
              updateTab(activeTab.id, { content: newValue });
            }
          }}
          className="flex-1 w-full p-4 resize-none outline-none bg-background font-sans"
          placeholder="Start typing... (Press / to focus)"
          autoFocus
        />
      )}

      {/* Status bar */}
      {activeTab && (
        <div className="bg-background px-4 py-1.5 text-xs text-muted-foreground flex justify-end gap-3 border-t">
          <span>
            {activeTab.content.trim()
              ? activeTab.content.trim().split(/\s+/).length
              : 0}{" "}
            words
          </span>
          <span>{activeTab.content.length} characters</span>
        </div>
      )}

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        isMac={isMac}
      />
    </div>
  );
}
