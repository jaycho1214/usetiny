import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IWorkbookData } from "@univerjs/presets";

interface SpreadsheetStore {
  workbookData: IWorkbookData | null;
  setWorkbookData: (data: IWorkbookData) => void;
}

export const useSpreadsheetStore = create<SpreadsheetStore>()(
  persist(
    (set) => ({
      workbookData: null,
      setWorkbookData: (data) => set({ workbookData: data }),
    }),
    {
      name: "spreadsheet-storage",
      version: 1,
      skipHydration: true,
    },
  ),
);
