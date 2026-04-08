import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  OutputFormat,
  QualityMode,
  ResizeMode,
  ImageFile,
  ImagePreset,
} from "./types";

interface ImageStore {
  // ── Persisted (user preferences) ─────────────────
  outputFormat: OutputFormat;
  qualityMode: QualityMode;
  quality: number;
  targetSizeKB: number;
  resizeMode: ResizeMode;
  resizeWidth: number | null;
  resizeHeight: number | null;
  resizePercent: number;
  resizePresetId: string | null;
  aspectRatioLocked: boolean;
  stripMetadata: boolean;
  stripGps: boolean;
  stripCamera: boolean;
  keepCopyright: boolean;
  customPresets: ImagePreset[];

  // ── Ephemeral (not persisted) ────────────────────
  files: Record<string, ImageFile>;
  fileOrder: string[];
  activeFileId: string | null;
  splitPosition: number;

  // ── Actions ──────────────────────────────────────
  setOutputFormat: (format: OutputFormat) => void;
  setQualityMode: (mode: QualityMode) => void;
  setQuality: (quality: number) => void;
  setTargetSizeKB: (kb: number) => void;
  setResizeMode: (mode: ResizeMode) => void;
  setResizeDimensions: (width: number | null, height: number | null) => void;
  setResizePercent: (percent: number) => void;
  setResizePresetId: (id: string | null) => void;
  toggleAspectRatioLock: () => void;
  setStripMetadata: (v: boolean) => void;
  setStripGps: (v: boolean) => void;
  setStripCamera: (v: boolean) => void;
  setKeepCopyright: (v: boolean) => void;

  addFile: (file: ImageFile) => void;
  removeFile: (id: string) => void;
  removeAllFiles: () => void;
  setActiveFile: (id: string | null) => void;
  updateFile: (id: string, updates: Partial<ImageFile>) => void;

  setSplitPosition: (pos: number) => void;

  saveCustomPreset: (name: string) => void;
  deleteCustomPreset: (id: string) => void;
  applyPreset: (preset: ImagePreset) => void;
}

export const useImageStore = create<ImageStore>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      outputFormat: "webp",
      qualityMode: "manual",
      quality: 80,
      targetSizeKB: 200,
      resizeMode: "none",
      resizeWidth: null,
      resizeHeight: null,
      resizePercent: 100,
      resizePresetId: null,
      aspectRatioLocked: true,
      stripMetadata: false,
      stripGps: true,
      stripCamera: false,
      keepCopyright: true,
      customPresets: [],

      // Ephemeral
      files: {},
      fileOrder: [],
      activeFileId: null,
      splitPosition: 50,

      // Settings actions
      setOutputFormat: (format) => set({ outputFormat: format }),
      setQualityMode: (mode) => set({ qualityMode: mode }),
      setQuality: (quality) => set({ quality }),
      setTargetSizeKB: (kb) => set({ targetSizeKB: kb }),
      setResizeMode: (mode) => set({ resizeMode: mode }),
      setResizeDimensions: (width, height) =>
        set({ resizeWidth: width, resizeHeight: height }),
      setResizePercent: (percent) => set({ resizePercent: percent }),
      setResizePresetId: (id) => set({ resizePresetId: id }),
      toggleAspectRatioLock: () =>
        set((s) => ({ aspectRatioLocked: !s.aspectRatioLocked })),
      setStripMetadata: (v) => set({ stripMetadata: v }),
      setStripGps: (v) => set({ stripGps: v }),
      setStripCamera: (v) => set({ stripCamera: v }),
      setKeepCopyright: (v) => set({ keepCopyright: v }),

      // File actions
      addFile: (file) =>
        set((s) => ({
          files: { ...s.files, [file.id]: file },
          fileOrder: [...s.fileOrder, file.id],
          activeFileId: s.activeFileId ?? file.id,
        })),

      removeFile: (id) =>
        set((s) => {
          const { [id]: removed, ...rest } = s.files;
          if (removed) {
            if (removed.originalUrl) URL.revokeObjectURL(removed.originalUrl);
            // thumbnailUrl is a data URL (toDataURL), no revocation needed
            if (removed.processedUrl)
              URL.revokeObjectURL(removed.processedUrl);
          }
          const newOrder = s.fileOrder.filter((fid) => fid !== id);
          let newActive = s.activeFileId;
          if (newActive === id) {
            const idx = s.fileOrder.indexOf(id);
            newActive = newOrder[Math.min(idx, newOrder.length - 1)] ?? null;
          }
          return {
            files: rest,
            fileOrder: newOrder,
            activeFileId: newActive,
          };
        }),

      removeAllFiles: () =>
        set((s) => {
          for (const f of Object.values(s.files)) {
            if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
            if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
          }
          return { files: {}, fileOrder: [], activeFileId: null };
        }),

      setActiveFile: (id) => set({ activeFileId: id }),

      updateFile: (id, updates) =>
        set((s) => {
          const existing = s.files[id];
          if (!existing) return s;
          // Revoke old processed URL when replacing
          if (updates.processedUrl && existing.processedUrl) {
            URL.revokeObjectURL(existing.processedUrl);
          }
          return {
            files: { ...s.files, [id]: { ...existing, ...updates } },
          };
        }),

      setSplitPosition: (pos) => set({ splitPosition: pos }),

      // Presets
      saveCustomPreset: (name) => {
        const s = get();
        const preset: ImagePreset = {
          id: nanoid(),
          name,
          format: s.outputFormat,
          quality: s.quality,
          resizeMode: s.resizeMode,
          resizeWidth: s.resizeWidth,
          resizeHeight: s.resizeHeight,
          resizePercent: s.resizePercent,
        };
        set({ customPresets: [...s.customPresets, preset] });
      },

      deleteCustomPreset: (id) =>
        set((s) => ({
          customPresets: s.customPresets.filter((p) => p.id !== id),
        })),

      applyPreset: (preset) =>
        set({
          outputFormat: preset.format,
          quality: preset.quality,
          resizeMode: preset.resizeMode,
          resizeWidth: preset.resizeWidth,
          resizeHeight: preset.resizeHeight,
          resizePercent: preset.resizePercent,
        }),
    }),
    {
      name: "image-compressor-storage",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({
        outputFormat: state.outputFormat,
        qualityMode: state.qualityMode,
        quality: state.quality,
        targetSizeKB: state.targetSizeKB,
        resizeMode: state.resizeMode,
        resizeWidth: state.resizeWidth,
        resizeHeight: state.resizeHeight,
        resizePercent: state.resizePercent,
        resizePresetId: state.resizePresetId,
        aspectRatioLocked: state.aspectRatioLocked,
        stripMetadata: state.stripMetadata,
        stripGps: state.stripGps,
        stripCamera: state.stripCamera,
        keepCopyright: state.keepCopyright,
        customPresets: state.customPresets,
      }),
    },
  ),
);
