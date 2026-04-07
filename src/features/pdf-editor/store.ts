import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Annotation, FormFieldType, Tool } from "./types";

const MAX_UNDO = 50;
interface PDFEditorState {
  pdfData: ArrayBuffer | null;
  fileName: string;
  totalPages: number;
  currentPage: number;
  zoom: number;

  activeTool: Tool;
  activeFormType: FormFieldType;
  drawColor: string;
  drawLineWidth: number;
  textColor: string;
  textFontSize: number;
  textBold: boolean;
  textItalic: boolean;
  textFontFamily: string;
  highlightColor: string;
  formBorderColor: string;

  annotations: Annotation[];
  selectedAnnotationId: string | null;
  clipboard: Annotation | null;
  _undoStack: { annotations: Annotation[]; pdfData: ArrayBuffer | null; totalPages: number }[];
  _redoStack: { annotations: Annotation[]; pdfData: ArrayBuffer | null; totalPages: number }[];

  sidebarOpen: boolean;
  hasUnsavedChanges: boolean;

  setPdfData: (data: ArrayBuffer, fileName: string) => void;
  restorePdfData: (data: ArrayBuffer) => void;
  setTotalPages: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setActiveTool: (tool: Tool) => void;
  setActiveFormType: (type: FormFieldType) => void;
  setDrawColor: (color: string) => void;
  setDrawLineWidth: (width: number) => void;
  setTextColor: (color: string) => void;
  setTextFontSize: (size: number) => void;
  setTextBold: (bold: boolean) => void;
  setTextItalic: (italic: boolean) => void;
  setTextFontFamily: (family: string) => void;
  setHighlightColor: (color: string) => void;
  setFormBorderColor: (color: string) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  moveAnnotation: (id: string, dx: number, dy: number) => void;
  /** Push undo once before a drag operation begins */
  beginDrag: () => void;
  /** Move without pushing undo (use during live drag) */
  dragMove: (id: string, dx: number, dy: number) => void;
  /** Resize without pushing undo (use during live drag) */
  dragResize: (id: string, pos: { x: number; y: number }, size: { width: number; height: number }) => void;
  removeAnnotation: (id: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  clearAnnotations: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  toggleSidebar: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  /** Replace PDF data and adjust annotations for page operations */
  applyPageOp: (newData: ArrayBuffer, newTotalPages: number, annotationUpdater: (anns: Annotation[]) => Annotation[]) => void;
  reset: () => void;
}

type Snapshot = { annotations: Annotation[]; pdfData: ArrayBuffer | null; totalPages: number };

const initialState = {
  pdfData: null as ArrayBuffer | null,
  fileName: "",
  totalPages: 0,
  currentPage: 0,
  zoom: 1,
  activeTool: "select" as Tool,
  activeFormType: "text" as FormFieldType,
  drawColor: "#000000",
  drawLineWidth: 2,
  textColor: "#000000",
  textFontSize: 16,
  textBold: false,
  textItalic: false,
  textFontFamily: "sans-serif",
  highlightColor: "#ffeb3b",
  formBorderColor: "#3b82f6",
  annotations: [] as Annotation[],
  selectedAnnotationId: null as string | null,
  clipboard: null as Annotation | null,
  _undoStack: [] as Snapshot[],
  _redoStack: [] as Snapshot[],
  sidebarOpen: true,
  hasUnsavedChanges: false,
};

function pushUndo(state: PDFEditorState) {
  // Share pdfData reference with previous snapshot if unchanged (saves memory)
  const prevSnap = state._undoStack[state._undoStack.length - 1];
  const pdfRef = prevSnap && prevSnap.pdfData === state.pdfData ? prevSnap.pdfData : state.pdfData;
  const snap: Snapshot = { annotations: state.annotations, pdfData: pdfRef, totalPages: state.totalPages };
  return {
    _undoStack: [...state._undoStack.slice(-MAX_UNDO), snap],
    _redoStack: [] as Snapshot[],
    hasUnsavedChanges: true,
  };
}

export const usePDFEditorStore = create<PDFEditorState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPdfData: (data, fileName) =>
        set({
          pdfData: data,
          fileName,
          annotations: [],
          currentPage: 0,
          selectedAnnotationId: null,
          _undoStack: [],
          _redoStack: [],
          hasUnsavedChanges: false,
        }),
      restorePdfData: (data) => set({ pdfData: data }),
      setTotalPages: (totalPages) => set({ totalPages }),
      setCurrentPage: (currentPage) =>
        set({ currentPage, selectedAnnotationId: null }),
      setZoom: (zoom) =>
        set((state) => ({
          zoom: typeof zoom === "function" ? zoom(state.zoom) : zoom,
        })),
      setActiveTool: (activeTool) =>
        set({ activeTool, selectedAnnotationId: null }),
      setActiveFormType: (activeFormType) => set({ activeFormType }),
      setDrawColor: (drawColor) => set({ drawColor }),
      setDrawLineWidth: (drawLineWidth) => set({ drawLineWidth }),
      setTextColor: (textColor) => set({ textColor }),
      setTextFontSize: (textFontSize) => set({ textFontSize }),
      setTextBold: (textBold) => set({ textBold }),
      setTextItalic: (textItalic) => set({ textItalic }),
      setTextFontFamily: (textFontFamily) => set({ textFontFamily }),
      setHighlightColor: (highlightColor) => set({ highlightColor }),
      setFormBorderColor: (formBorderColor) => set({ formBorderColor }),

      addAnnotation: (annotation) =>
        set((state) => ({
          ...pushUndo(state),
          annotations: [...state.annotations, annotation],
        })),
      updateAnnotation: (id, updates) =>
        set((state) => {
          const next: Annotation[] = state.annotations.map((a) => {
            if (a.id !== id) return a;
            return { ...a, ...updates } as Annotation;
          });
          return { ...pushUndo(state), annotations: next };
        }),
      moveAnnotation: (id, dx, dy) =>
        set((state) => {
          const next: Annotation[] = state.annotations.map((a) => {
            if (a.id !== id) return a;
            if (a.type === "draw") {
              return { ...a, points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
            }
            if ("position" in a) {
              return { ...a, position: { x: a.position.x + dx, y: a.position.y + dy } } as Annotation;
            }
            return a;
          });
          return { ...pushUndo(state), annotations: next };
        }),
      beginDrag: () =>
        set((state) => {
          const snap: Snapshot = { annotations: state.annotations, pdfData: state.pdfData, totalPages: state.totalPages };
          return { _undoStack: [...state._undoStack.slice(-MAX_UNDO), snap], _redoStack: [] as Snapshot[] };
        }),
      dragMove: (id, dx, dy) =>
        set((state) => ({
          annotations: state.annotations.map((a) => {
            if (a.id !== id) return a;
            if (a.type === "draw") {
              return { ...a, points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
            }
            if ("position" in a) {
              return { ...a, position: { x: a.position.x + dx, y: a.position.y + dy } } as Annotation;
            }
            return a;
          }),
          hasUnsavedChanges: true,
        })),
      dragResize: (id, pos, size) =>
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? ({ ...a, position: pos, size } as Annotation) : a
          ),
          hasUnsavedChanges: true,
        })),
      removeAnnotation: (id) =>
        set((state) => ({
          ...pushUndo(state),
          annotations: state.annotations.filter((a) => a.id !== id),
          selectedAnnotationId:
            state.selectedAnnotationId === id
              ? null
              : state.selectedAnnotationId,
        })),
      setSelectedAnnotationId: (selectedAnnotationId) =>
        set({ selectedAnnotationId }),
      clearAnnotations: () =>
        set((state) => ({
          ...pushUndo(state),
          annotations: [],
          selectedAnnotationId: null,
        })),

      copySelected: () => {
        const state = get();
        if (!state.selectedAnnotationId) return;
        const ann = state.annotations.find(
          (a) => a.id === state.selectedAnnotationId
        );
        if (ann) set({ clipboard: structuredClone(ann) });
      },
      pasteClipboard: () =>
        set((state) => {
          if (!state.clipboard) return state;
          const pasted = {
            ...structuredClone(state.clipboard),
            id: nanoid(),
            pageIndex: state.currentPage,
          } as Annotation;
          // Offset slightly so it's visible
          if ("position" in pasted) {
            pasted.position = {
              x: pasted.position.x + 0.02,
              y: pasted.position.y + 0.02,
            };
          }
          if (pasted.type === "draw") {
            pasted.points = pasted.points.map((p) => ({
              x: p.x + 0.02,
              y: p.y + 0.02,
            }));
          }
          return {
            ...pushUndo(state),
            annotations: [...state.annotations, pasted],
            selectedAnnotationId: pasted.id,
          };
        }),
      duplicateSelected: () => {
        const state = get();
        if (!state.selectedAnnotationId) return;
        const ann = state.annotations.find(
          (a) => a.id === state.selectedAnnotationId
        );
        if (ann) {
          set({ clipboard: structuredClone(ann) });
          get().pasteClipboard();
        }
      },

      undo: () =>
        set((state) => {
          if (state._undoStack.length === 0) return state;
          const prev = state._undoStack[state._undoStack.length - 1];
          const current: Snapshot = { annotations: state.annotations, pdfData: state.pdfData, totalPages: state.totalPages };
          return {
            _undoStack: state._undoStack.slice(0, -1),
            _redoStack: [...state._redoStack, current],
            annotations: prev.annotations,
            pdfData: prev.pdfData,
            totalPages: prev.totalPages,
            currentPage: Math.min(state.currentPage, prev.totalPages - 1),
            selectedAnnotationId: null,
            hasUnsavedChanges: true,
          };
        }),
      redo: () =>
        set((state) => {
          if (state._redoStack.length === 0) return state;
          const next = state._redoStack[state._redoStack.length - 1];
          const current: Snapshot = { annotations: state.annotations, pdfData: state.pdfData, totalPages: state.totalPages };
          return {
            _redoStack: state._redoStack.slice(0, -1),
            _undoStack: [...state._undoStack, current],
            annotations: next.annotations,
            pdfData: next.pdfData,
            totalPages: next.totalPages,
            currentPage: Math.min(state.currentPage, next.totalPages - 1),
            selectedAnnotationId: null,
            hasUnsavedChanges: true,
          };
        }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      markSaved: () => set({ hasUnsavedChanges: false }),
      applyPageOp: (newData, newTotalPages, annotationUpdater) =>
        set((state) => ({
          ...pushUndo(state),
          pdfData: newData,
          totalPages: newTotalPages,
          annotations: annotationUpdater(state.annotations),
          currentPage: Math.min(state.currentPage, newTotalPages - 1),
          selectedAnnotationId: null,
        })),
      reset: () => set(initialState),
    }),
    {
      name: "pdf-editor-storage",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({
        fileName: state.fileName,
        totalPages: state.totalPages,
        currentPage: state.currentPage,
        zoom: state.zoom,
        activeTool: state.activeTool,
        activeFormType: state.activeFormType,
        drawColor: state.drawColor,
        drawLineWidth: state.drawLineWidth,
        textColor: state.textColor,
        textFontSize: state.textFontSize,
        textBold: state.textBold,
        textItalic: state.textItalic,
        textFontFamily: state.textFontFamily,
        highlightColor: state.highlightColor,
        formBorderColor: state.formBorderColor,
        annotations: state.annotations,
        sidebarOpen: state.sidebarOpen,
        hasUnsavedChanges: state.hasUnsavedChanges,
      }),
    }
  )
);
