"use client";

import { useRichTextStore, isEmptyDoc, type RichTextTab } from "../store";
import { useIsMac, useKeyboardShortcuts } from "./keyboard-shortcuts";
import { Editor, type EditorHandle } from "./editor";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Keyboard, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { EditorStats } from "./editor-stats";
import { toast } from "sonner";
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/react";

export default function RichTextContent() {
  const tabOrder = useRichTextStore((s) => s.tabOrder);
  const tabs = useRichTextStore((s) => s.tabs);
  const activeTabId = useRichTextStore((s) => s.activeTabId);
  const createTab = useRichTextStore((s) => s.createTab);
  const deleteTab = useRichTextStore((s) => s.deleteTab);
  const restoreTab = useRichTextStore((s) => s.restoreTab);
  const updateTab = useRichTextStore((s) => s.updateTab);
  const setActiveTab = useRichTextStore((s) => s.setActiveTab);

  const isMac = useIsMac();
  const editorRef = useRef<EditorHandle | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const prevActiveTabIdRef = useRef<string | null>(activeTabId);

  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);

  const handleDeleteTab = useCallback(
    (id: string) => {
      const tab = useRichTextStore.getState().tabs[id];
      if (!tab) return;
      const hasContent = !isEmptyDoc(tab.content) || tab.title !== "Untitled";
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
    editorRef,
    titleInputRef,
    toggleShortcuts,
    handleDeleteTab,
  );
  const rehydrated = useStoreHydration(useRichTextStore);

  // Auto-delete untouched tabs when switching away
  useEffect(() => {
    const prevTabId = prevActiveTabIdRef.current;
    const currentTabId = activeTabId;
    if (prevTabId && prevTabId !== currentTabId && tabs[prevTabId]) {
      const prevTab = tabs[prevTabId];
      if (isEmptyDoc(prevTab.content) && prevTab.title === "Untitled") {
        deleteTab(prevTabId);
      }
    }
    prevActiveTabIdRef.current = currentTabId;
  }, [activeTabId, tabs, deleteTab]);

  const orderedTabs = tabOrder
    .map((id) => tabs[id])
    .filter((tab): tab is RichTextTab => Boolean(tab));
  const activeTab = tabs[activeTabId] || orderedTabs[0] || null;
  const tabCount = orderedTabs.length;

  const handleEditorUpdate = useCallback(
    (json: JSONContent) => {
      const stringified = JSON.stringify(json);
      if (stringified.length > 1_000_000) {
        toast.error("Content limit reached (1MB)");
        return;
      }
      updateTab(activeTabId, { content: json });
    },
    [activeTabId, updateTab],
  );

  if (!rehydrated) {
    return <FullscreenLoading />;
  }

  const isFirstVisit =
    tabCount === 1 &&
    isEmptyDoc(activeTab?.content ?? null) &&
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
                onEnterFocus={() => editorRef.current?.focus()}
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
                  onEnterFocus={() => editorRef.current?.focus()}
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
            <div className="flex-1 flex overflow-y-auto">
              <div className="flex-1 flex flex-col max-w-prose mx-auto w-full px-6 pt-8 pb-12">
                {isFirstVisit && (
                  <p className="text-sm text-muted-foreground/50 mb-6 leading-relaxed select-none">
                    Your notes are saved locally in this browser.
                    <br />
                    Press <span className="font-mono">/</span> for blocks, or
                    select text to format.
                  </p>
                )}
                <Editor
                  ref={editorRef}
                  tabId={activeTab.id}
                  initialContent={activeTab.content}
                  onUpdate={handleEditorUpdate}
                  onReady={setEditor}
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
              <EditorStats editor={editor} />
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
