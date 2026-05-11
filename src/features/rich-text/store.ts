import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { JSONContent } from "@tiptap/react";
import { computeTabOrder } from "@/lib/tab-order";

export interface RichTextTab {
  id: string;
  title: string;
  content: JSONContent | null;
  lastEditedAt: number;
}

interface RichTextStore {
  tabs: Record<string, RichTextTab>;
  tabOrder: string[];
  activeTabId: string;
  createTab: () => void;
  deleteTab: (id: string) => void;
  restoreTab: (tab: RichTextTab) => void;
  updateTab: (
    id: string,
    updates: Partial<Omit<RichTextTab, "lastEditedAt">>,
  ) => void;
  setActiveTab: (id: string) => void;
}

const initialTab: RichTextTab = {
  id: nanoid(),
  title: "Untitled",
  content: null,
  lastEditedAt: Date.now(),
};

export function isEmptyDoc(doc: JSONContent | null): boolean {
  if (!doc) return true;
  if (!doc.content || doc.content.length === 0) return true;
  if (doc.content.length === 1) {
    const only = doc.content[0];
    if (
      only.type === "paragraph" &&
      (!only.content || only.content.length === 0)
    ) {
      return true;
    }
  }
  return false;
}

export const useRichTextStore = create<RichTextStore>()(
  persist(
    (set, get) => ({
      tabs: {
        [initialTab.id]: initialTab,
      },
      tabOrder: [initialTab.id],
      activeTabId: initialTab.id,
      createTab: () => {
        const state = get();
        if (Object.keys(state.tabs).length >= 50) {
          return;
        }
        const newId = nanoid();
        const newTab: RichTextTab = {
          id: newId,
          title: "Untitled",
          content: null,
          lastEditedAt: Date.now(),
        };
        const newTabs = { ...state.tabs, [newId]: newTab };
        set({
          tabs: newTabs,
          tabOrder: computeTabOrder(newTabs),
          activeTabId: newId,
        });
      },
      deleteTab: (id) => {
        const state = get();
        const tabIds = Object.keys(state.tabs);

        if (tabIds.length === 1) {
          const resetTab: RichTextTab = {
            ...state.tabs[id],
            title: "Untitled",
            content: null,
            lastEditedAt: Date.now(),
          };
          const newTabs = { [id]: resetTab };
          set({
            tabs: newTabs,
            tabOrder: computeTabOrder(newTabs),
            activeTabId: id,
          });
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removed, ...remainingTabs } = state.tabs;
        const remainingIds = Object.keys(remainingTabs);

        const newActiveId =
          state.activeTabId === id ? remainingIds[0] : state.activeTabId;

        set({
          tabs: remainingTabs,
          tabOrder: computeTabOrder(remainingTabs),
          activeTabId: newActiveId,
        });
      },
      restoreTab: (tab) => {
        const state = get();
        if (Object.keys(state.tabs).length >= 50) return;
        const newTabs = { ...state.tabs, [tab.id]: tab };
        set({
          tabs: newTabs,
          tabOrder: computeTabOrder(newTabs),
          activeTabId: tab.id,
        });
      },
      updateTab: (id, updates) => {
        const newTabs = {
          ...get().tabs,
          [id]: {
            ...get().tabs[id],
            ...updates,
            lastEditedAt: Date.now(),
          },
        };
        set({
          tabs: newTabs,
          tabOrder: computeTabOrder(newTabs),
        });
      },
      setActiveTab: (id) => {
        const state = get();
        if (state.tabs[id]) {
          set({ activeTabId: id });
        }
      },
    }),
    {
      name: "rich-text-storage",
      version: 1,
      skipHydration: true,
    },
  ),
);
