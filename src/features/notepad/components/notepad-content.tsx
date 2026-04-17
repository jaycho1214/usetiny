"use client";

import { useNotepadStore } from "../store";
import { useIsMac, useKeyboardShortcuts } from "./keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Keyboard, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { toast } from "sonner";

export default function NotepadContent() {
  const tabOrder = useNotepadStore((s) => s.tabOrder);
  const tabs = useNotepadStore((s) => s.tabs);
  const activeTabId = useNotepadStore((s) => s.activeTabId);
  const createTab = useNotepadStore((s) => s.createTab);
  const deleteTab = useNotepadStore((s) => s.deleteTab);
  const restoreTab = useNotepadStore((s) => s.restoreTab);
  const updateTab = useNotepadStore((s) => s.updateTab);
  const setActiveTab = useNotepadStore((s) => s.setActiveTab);

  const isMac = useIsMac();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const prevActiveTabIdRef = useRef<string | null>(activeTabId);

  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);

  const handleDeleteTab = useCallback(
    (id: string) => {
      const tab = useNotepadStore.getState().tabs[id];
      if (!tab) return;

      const hasContent = tab.content.trim() !== "" || tab.title !== "Untitled";
      deleteTab(id);

      if (hasContent) {
        toast("Tab deleted", {
          action: {
            label: "Undo",
            onClick: () => restoreTab(tab),
          },
          duration: 5000,
        });
      }
    },
    [deleteTab, restoreTab],
  );

  useKeyboardShortcuts(
    textareaRef,
    titleInputRef,
    toggleShortcuts,
    handleDeleteTab,
  );
  const rehydrated = useStoreHydration(useNotepadStore);

  // Auto-delete untouched tabs when switching
  useEffect(() => {
    const prevTabId = prevActiveTabIdRef.current;
    const currentTabId = activeTabId;

    if (prevTabId && prevTabId !== currentTabId && tabs[prevTabId]) {
      const prevTab = tabs[prevTabId];
      if (prevTab.content.trim() === "" && prevTab.title === "Untitled") {
        deleteTab(prevTabId);
      }
    }

    prevActiveTabIdRef.current = currentTabId;
  }, [activeTabId, tabs, deleteTab]);

  const orderedTabs = useMemo(
    () =>
      tabOrder
        .map((id) => tabs[id])
        .filter((tab): tab is import("../store").NotepadTab => Boolean(tab)),
    [tabOrder, tabs],
  );
  const activeTab = tabs[activeTabId] || orderedTabs[0] || null;
  const tabCount = orderedTabs.length;

  const wordCount = useMemo(
    () =>
      activeTab?.content.trim()
        ? activeTab.content.trim().split(/\s+/).length
        : 0,
    [activeTab?.content],
  );

  if (!rehydrated) {
    return <FullscreenLoading />;
  }

  const isFirstVisit =
    tabCount === 1 &&
    activeTab?.content === "" &&
    activeTab?.title === "Untitled";

  return (
    <div className="h-dvh flex flex-col">
      {/* Mobile navbar */}
      <div className="md:hidden bg-background px-4 py-2 flex items-center gap-2">
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
                  : "hover:bg-accent hover:text-accent-foreground",
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
                onDelete={handleDeleteTab}
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

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r shrink-0">
          <div className="px-3 py-2 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-semibold hover:opacity-70 transition-opacity"
            >
              UseTiny
            </Link>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
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
                    variant="ghost"
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
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {orderedTabs.map((tab, index) => (
              <div
                key={tab.id}
                className={cn(
                  "group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                  tab.id === activeTabId
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
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
                  onDelete={handleDeleteTab}
                  variant="sidebar"
                />
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeTab && (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col max-w-prose mx-auto w-full px-6 pt-8">
                {isFirstVisit && (
                  <p className="text-sm text-muted-foreground/50 mb-6 leading-relaxed select-none">
                    Your notes are saved locally in this browser.
                    <br />
                    {isMac ? "⌘" : "Ctrl+"}K to create a new tab.
                  </p>
                )}
                <textarea
                  ref={textareaRef}
                  value={activeTab.content}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= 1000000) {
                      updateTab(activeTab.id, { content: newValue });
                    } else {
                      toast.error("Content limit reached (1MB)");
                    }
                  }}
                  className="flex-1 w-full resize-none outline-none bg-transparent text-base leading-relaxed placeholder:text-muted-foreground/40"
                  placeholder="Start typing..."
                  autoFocus
                />
              </div>
            </div>
          )}

          {activeTab && (
            <div className="bg-background px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-3 border-t">
              <span className="opacity-60">
                {tabCount} {tabCount === 1 ? "tab" : "tabs"}
              </span>
              <div className="flex-1" />
              <span className="opacity-60">Saved</span>
              <span>{wordCount} words</span>
              <span>{activeTab.content.length} chars</span>
            </div>
          )}
        </div>
      </div>

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        isMac={isMac}
      />
    </div>
  );
}
