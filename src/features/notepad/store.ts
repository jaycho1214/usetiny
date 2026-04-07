import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface NotepadTab {
  id: string;
  title: string;
  content: string;
  lastEditedAt: number;
}

interface NotepadStore {
  tabs: Record<string, NotepadTab>;
  tabOrder: string[];
  activeTabId: string;
  createTab: () => void;
  deleteTab: (id: string) => void;
  restoreTab: (tab: NotepadTab) => void;
  updateTab: (
    id: string,
    updates: Partial<Omit<NotepadTab, "lastEditedAt">>,
  ) => void;
  setActiveTab: (id: string) => void;
}

const initialTab = {
  id: nanoid(),
  title: "Untitled",
  content: "",
  lastEditedAt: Date.now(),
};

// Helper to compute tab order from tabs
const computeTabOrder = (tabs: Record<string, NotepadTab>): string[] => {
  return Object.values(tabs)
    .sort((a, b) => b.lastEditedAt - a.lastEditedAt)
    .map((tab) => tab.id);
};

export const useNotepadStore = create<NotepadStore>()(
  persist(
    (set, get) => ({
      tabs: {
        [initialTab.id]: initialTab,
      },
      tabOrder: [initialTab.id],
      activeTabId: initialTab.id,
      createTab: () => {
        const state = get();
        // Limit to 50 tabs to prevent abuse and localStorage exhaustion
        if (Object.keys(state.tabs).length >= 50) {
          return;
        }
        const newId = nanoid();
        const newTab = {
          id: newId,
          title: "Untitled",
          content: "",
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

        // If this is the last tab, reset it instead of deleting
        if (tabIds.length === 1) {
          const resetTab = {
            ...state.tabs[id],
            title: "Untitled",
            content: "",
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

        // Set new active tab if we're deleting the active one
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
        // Only set if the tab exists
        if (state.tabs[id]) {
          set({ activeTabId: id });
        }
      },
    }),
    {
      name: "notepad-storage",
      version: 1,
      skipHydration: true,
    },
  ),
);
