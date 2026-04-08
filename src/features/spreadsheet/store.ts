import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SpreadsheetStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workbookData: Record<string, any> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWorkbookData: (data: Record<string, any>) => void;
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
