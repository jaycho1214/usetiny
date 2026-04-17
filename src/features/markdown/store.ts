import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PageSize = "a4" | "letter" | "legal";
export type Orientation = "portrait" | "landscape";
export type Margins = "narrow" | "normal" | "wide";
export type ViewMode = "editor" | "split" | "preview";

export interface ExportSettings {
  pageSize: PageSize;
  orientation: Orientation;
  margins: Margins;
  pageNumbers: boolean;
  headerFooter: boolean;
  filename: string;
}

interface MarkdownStore {
  content: string;
  viewMode: ViewMode;
  exportSettings: ExportSettings;
  updateContent: (content: string) => void;
  setViewMode: (mode: ViewMode) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
}

const defaultExportSettings: ExportSettings = {
  pageSize: "a4",
  orientation: "portrait",
  margins: "normal",
  pageNumbers: false,
  headerFooter: false,
  filename: "",
};

export const useMarkdownStore = create<MarkdownStore>()(
  persist(
    (set, get) => ({
      content: "",
      viewMode: "split" as ViewMode,
      exportSettings: defaultExportSettings,

      updateContent: (content: string) => {
        set({ content });
      },

      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      updateExportSettings: (settings: Partial<ExportSettings>) => {
        set({
          exportSettings: { ...get().exportSettings, ...settings },
        });
      },
    }),
    {
      name: "markdown-storage",
      version: 3,
      skipHydration: true,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<MarkdownStore> | undefined;
        if (version < 2 && state?.exportSettings) {
          state.exportSettings = {
            ...defaultExportSettings,
            ...state.exportSettings,
          };
        }
        // v3: clear the old "document" default so first-H1 auto-derivation kicks in.
        if (version < 3 && state?.exportSettings?.filename === "document") {
          state.exportSettings.filename = "";
        }
        return state as MarkdownStore;
      },
    },
  ),
);
