import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WordCounterStore {
  text: string;
  setText: (text: string) => void;
}

export const useWordCounterStore = create<WordCounterStore>()(
  persist(
    (set) => ({
      text: "",
      setText: (text: string) => {
        set({ text });
      },
    }),
    {
      name: "word-counter-storage",
      version: 1,
      skipHydration: true,
    },
  ),
);
