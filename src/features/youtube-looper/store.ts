import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface SavedLoop {
  id: string;
  name: string;
  videoId: string;
  videoTitle: string;
  start: number;
  end: number;
  speed: number;
  createdAt: number;
}

interface YoutubeLooperStore {
  savedLoops: SavedLoop[];
  lastVideoId: string | null;
  saveLoop: (loop: Omit<SavedLoop, "id" | "createdAt">) => SavedLoop | null;
  renameLoop: (id: string, name: string) => void;
  deleteLoop: (id: string) => void;
  setLastVideoId: (id: string | null) => void;
}

export const useYoutubeLooperStore = create<YoutubeLooperStore>()(
  persist(
    (set, get) => ({
      savedLoops: [],
      lastVideoId: null,
      saveLoop: (loop) => {
        const state = get();
        if (state.savedLoops.length >= 100) return null;
        const newLoop: SavedLoop = {
          ...loop,
          id: nanoid(),
          createdAt: Date.now(),
        };
        set({ savedLoops: [newLoop, ...state.savedLoops] });
        return newLoop;
      },
      renameLoop: (id, name) => {
        set({
          savedLoops: get().savedLoops.map((l) =>
            l.id === id ? { ...l, name } : l,
          ),
        });
      },
      deleteLoop: (id) => {
        set({ savedLoops: get().savedLoops.filter((l) => l.id !== id) });
      },
      setLastVideoId: (id) => set({ lastVideoId: id }),
    }),
    {
      name: "youtube-looper-storage",
      version: 1,
      skipHydration: true,
    },
  ),
);
