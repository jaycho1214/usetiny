"use client";

import { useNotepadStore } from "../store";
import { useIsMac, useKeyboardShortcuts } from "./keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Plus, X } from "lucide-react";
import { useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useHydrationStoreStatus } from "@/hooks/use-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";

export default function NotepadContent() {
  const {
    tabs,
    tabOrder,
    activeTabId,
    createTab,
    deleteTab,
    updateTab,
    setActiveTab,
  } = useNotepadStore((state) => ({
    ...state,
    activeTab: state.tabs[state.activeTabId] || state.tabs[0],
  }));

  const isMac = useIsMac();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useKeyboardShortcuts(textareaRef);
  const rehydrated = useHydrationStoreStatus(useNotepadStore);

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
          UseTools
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={createTab}
              className="h-7 w-7 relative group"
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
              <input
                value={tab.title}
                maxLength={100}
                onChange={(e) => {
                  e.stopPropagation();
                  updateTab(tab.id, { title: e.target.value });
                }}
                className="bg-transparent outline-none w-20 text-sm"
                placeholder="Untitled"
              />
              {index < 9 && (
                <Kbd className="text-[10px] px-1 py-0">
                  {isMac ? "⌘" : "Ctrl+"}
                  {index + 1}
                </Kbd>
              )}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTab(tab.id);
                }}
                className="hover:bg-destructive/20 rounded p-0.5 -mr-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
}
