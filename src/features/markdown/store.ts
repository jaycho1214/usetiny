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
      version: 1,
      skipHydration: true,
    },
  ),
);
