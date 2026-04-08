"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { usePDFEditorStore } from "../store";
import type {
  Annotation,
  DrawAnnotation,
  FormAnnotation,
  HighlightAnnotation,
  Point,
  TextAnnotation,
} from "../types";

interface Props {
  page: PDFPageProxy;
  pageIndex: number;
}

type DragState =
  | { kind: "idle" }
  | { kind: "draw"; points: Point[] }
  | { kind: "rect"; start: Point; current: Point; tool: "highlight" | "form" }
  | {
      kind: "move";
      id: string;
      mouseStart: Point;
      annStartX: number;
      annStartY: number;
      started: boolean;
    }
  | {
      kind: "resize";
      id: string;
      corner: Corner;
      origin: Point;
      origPos: Point;
      origSize: { width: number; height: number };
      started: boolean;
    };

type Corner = "tl" | "tr" | "bl" | "br";
const IDLE: DragState = { kind: "idle" };
const HANDLE_SIZE = 8;

// ── Snap/magnet helpers ─────────────────────────────────────────────
const SNAP_THRESHOLD = 0.006; // ~4px at 100% zoom on 612px page

interface SnapGuide {
  axis: "x" | "y";
  pos: number;
}

function collectEdges(
  anns: Annotation[],
  excludeId: string,
  w: number,
  h: number,
  z: number,
) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const a of anns) {
    if (a.id === excludeId) continue;
    const b = getBBox(a, w, h, z);
    if (!b) continue;
    // Normalize to 0-1
    xs.push(b.x / w, (b.x + b.w) / w, (b.x + b.w / 2) / w);
    ys.push(b.y / h, (b.y + b.h) / h, (b.y + b.h / 2) / h);
  }
  return { xs, ys };
}

function snapPos(
  val: number,
  targets: number[],
): { snapped: number; guide: number | null } {
  let best = val,
    bestDist = SNAP_THRESHOLD,
    guide: number | null = null;
  for (const t of targets) {
    const d = Math.abs(val - t);
    if (d < bestDist) {
      best = t;
      bestDist = d;
      guide = t;
    }
  }
  return { snapped: best, guide };
}

function snapRect(
  x: number,
  y: number,
  w: number,
  h: number,
  edges: { xs: number[]; ys: number[] },
): { x: number; y: number; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  // Try snapping left, center, right edges
  const xVals = [x, x + w, x + w / 2];
  let bestXDist = SNAP_THRESHOLD,
    snapX = x,
    snapXGuide: number | null = null;
  for (const val of xVals) {
    const s = snapPos(val, edges.xs);
    if (s.guide !== null && Math.abs(val - s.snapped) < bestXDist) {
      bestXDist = Math.abs(val - s.snapped);
      snapX = x + (s.snapped - val);
      snapXGuide = s.guide;
    }
  }
  if (snapXGuide !== null) guides.push({ axis: "x", pos: snapXGuide });

  const yVals = [y, y + h, y + h / 2];
  let bestYDist = SNAP_THRESHOLD,
    snapY = y,
    snapYGuide: number | null = null;
  for (const val of yVals) {
    const s = snapPos(val, edges.ys);
    if (s.guide !== null && Math.abs(val - s.snapped) < bestYDist) {
      bestYDist = Math.abs(val - s.snapped);
      snapY = y + (s.snapped - val);
      snapYGuide = s.guide;
    }
  }
  if (snapYGuide !== null) guides.push({ axis: "y", pos: snapYGuide });

  return { x: snapX, y: snapY, guides };
}

// ═══════════════════════════════════════════════════════════════════

export function PDFPageCanvas({ page, pageIndex }: Props) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const zoom = usePDFEditorStore((s) => s.zoom);
  const activeTool = usePDFEditorStore((s) => s.activeTool);
  const annotations = usePDFEditorStore((s) => s.annotations);
  const addAnnotation = usePDFEditorStore((s) => s.addAnnotation);
  const beginDrag = usePDFEditorStore((s) => s.beginDrag);
  const dragMove = usePDFEditorStore((s) => s.dragMove);
  const dragResize = usePDFEditorStore((s) => s.dragResize);
  const selectedId = usePDFEditorStore((s) => s.selectedAnnotationId);
  const setSelectedId = usePDFEditorStore((s) => s.setSelectedAnnotationId);
  const updateAnnotation = usePDFEditorStore((s) => s.updateAnnotation);
  const drawColor = usePDFEditorStore((s) => s.drawColor);
  const drawLineWidth = usePDFEditorStore((s) => s.drawLineWidth);
  const textColor = usePDFEditorStore((s) => s.textColor);
  const textFontSize = usePDFEditorStore((s) => s.textFontSize);
  const textBold = usePDFEditorStore((s) => s.textBold);
  const textItalic = usePDFEditorStore((s) => s.textItalic);
  const textFontFamily = usePDFEditorStore((s) => s.textFontFamily);
  const highlightColor = usePDFEditorStore((s) => s.highlightColor);
  const formBorderColor = usePDFEditorStore((s) => s.formBorderColor);

  const [editingText, setEditingText] = useState<{
    id: string | null;
    x: number;
    y: number;
    content: string;
    fontSize: number;
    color: string;
    bold?: boolean;
    italic?: boolean;
    fontFamily?: string;
  } | null>(null);

  const [editingForm, setEditingForm] = useState<{
    id: string;
    field: "label" | "value";
    x: number;
    y: number;
    w: number;
    h: number;
    text: string;
  } | null>(null);

  const { width, height } = useMemo(() => {
    const vp = page.getViewport({ scale: zoom });
    return { width: vp.width, height: vp.height };
  }, [page, zoom]);

  const pageAnnotations = useMemo(
    () => annotations.filter((a) => a.pageIndex === pageIndex),
    [annotations, pageIndex],
  );

  const dragRef = useRef<DragState>(IDLE);
  const rafRef = useRef(0);
  const guidesRef = useRef<SnapGuide[]>([]);
  const cachedEdgesRef = useRef<{ xs: number[]; ys: number[] } | null>(null);

  // stable refs
  // Packed into a single ref to avoid React 19 lint issues with render-time ref mutations
  const stateRef = useRef({
    pageAnnotations,
    selectedId,
    zoom,
    width,
    height,
    drawColor,
    drawLineWidth,
    highlightColor,
    formBorderColor,
    editingText,
    editingForm,
  });
  useEffect(() => {
    stateRef.current = {
      pageAnnotations,
      selectedId,
      zoom,
      width,
      height,
      drawColor,
      drawLineWidth,
      highlightColor,
      formBorderColor,
      editingText,
      editingForm,
    };
  });

  const removeAnnotation = usePDFEditorStore((s) => s.removeAnnotation);
  const interactionRef = useRef<HTMLDivElement>(null);
  const getPos = useCallback((e: React.MouseEvent): Point => {
    // Use the interaction div ref — e.currentTarget can be unreliable
    const el = interactionRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  }, []);

  // ── render overlay (reads stateRef — React Compiler can't auto-memoize)
   
  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = stateRef.current.width,
      h = stateRef.current.height,
      z = stateRef.current.zoom;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const editingId = editingText?.id ?? editingForm?.id;
    for (const ann of stateRef.current.pageAnnotations) {
      if (ann.id === editingId) continue; // Hide annotation being edited (textarea/input is showing instead)
      switch (ann.type) {
        case "draw":
          drawStroke(ctx, ann, w, h, z);
          break;
        case "highlight":
          drawHighlight(ctx, ann, w, h);
          break;
        case "text":
          drawText(ctx, ann, w, h, z);
          break;
        case "form":
          drawFormField(ctx, ann, w, h, z);
          break;
      }
    }

    const sel = stateRef.current.selectedId;
    if (sel && sel !== editingId) {
      const s = stateRef.current.pageAnnotations.find((a) => a.id === sel);
      if (s) drawSelection(ctx, s, w, h, z);
    }

    // Snap guides
    for (const g of guidesRef.current) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      if (g.axis === "x") {
        const px = g.pos * w;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      } else {
        const py = g.pos * h;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // in-progress draw
    const ds = dragRef.current;
    if (ds.kind === "draw" && ds.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = stateRef.current.drawColor;
      ctx.lineWidth = stateRef.current.drawLineWidth * z;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(ds.points[0].x * w, ds.points[0].y * h);
      for (let i = 1; i < ds.points.length; i++)
        ctx.lineTo(ds.points[i].x * w, ds.points[i].y * h);
      ctx.stroke();
    } else if (ds.kind === "rect") {
      const rx = Math.min(ds.start.x, ds.current.x) * w;
      const ry = Math.min(ds.start.y, ds.current.y) * h;
      const rw = Math.abs(ds.current.x - ds.start.x) * w;
      const rh = Math.abs(ds.current.y - ds.start.y) * h;
      if (ds.tool === "highlight") {
        ctx.fillStyle = stateRef.current.highlightColor + "59";
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = stateRef.current.highlightColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, rw, rh);
      } else {
        drawFormPreview(ctx, rx, ry, rw, rh, stateRef.current.formBorderColor);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads fresh state via stateRef to avoid re-creating on every annotation change
  }, []);

  // ── render PDF ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const vp = page.getViewport({ scale: zoom });
    const dpr = window.devicePixelRatio || 1;
    canvas.width = vp.width * dpr;
    canvas.height = vp.height * dpr;
    canvas.style.width = `${vp.width}px`;
    canvas.style.height = `${vp.height}px`;
    ctx.scale(dpr, dpr);
    const task = page.render({
      canvas,
      canvasContext: ctx,
      viewport: vp,
      annotationMode: 0,
    } as Parameters<typeof page.render>[0]);
    return () => {
      task.cancel();
    };
  }, [page, zoom]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderOverlay();
  }, [width, height, pageAnnotations, selectedId, zoom, renderOverlay]);

  // ── mousedown ─────────────────────────────────────────────────────
  const finalizeTextRef = useRef(() => {});
  const finalizeFormRef = useRef(() => {});
  const finalizingRef = useRef(false);

  const onDown = useCallback(
    function onDown(e: React.MouseEvent) {
      // Helpers (defined inside useCallback to avoid dep issues)
      const doHitTest = (pos: Point, anns?: Annotation[]) =>
        hitTest(
          pos,
          anns ?? stateRef.current.pageAnnotations,
          stateRef.current.width,
          stateRef.current.height,
          stateRef.current.zoom,
        );
      const initMove = (id: string, pos: Point) => {
        const b = getBBox(
          stateRef.current.pageAnnotations.find((a) => a.id === id)!,
          stateRef.current.width,
          stateRef.current.height,
          stateRef.current.zoom,
        );
        dragRef.current = {
          kind: "move",
          id,
          mouseStart: pos,
          annStartX: b ? b.x / stateRef.current.width : 0,
          annStartY: b ? b.y / stateRef.current.height : 0,
          started: false,
        };
      };
      const initResize = (
        ann: FormAnnotation | HighlightAnnotation,
        corner: Corner,
        pos: Point,
      ) => {
        dragRef.current = {
          kind: "resize",
          id: ann.id,
          corner,
          origin: pos,
          origPos: { ...ann.position },
          origSize: { ...ann.size },
          started: false,
        };
      };
      // If editing, finalize via the same functions used by onBlur (prevents double-save)
      if (editingText) {
        finalizeTextRef.current();
        return;
      }
      if (editingForm) {
        finalizeFormRef.current();
        return;
      }
      const pos = getPos(e);
      guidesRef.current = [];

      // ── Eraser mode: click to delete ──
      if (activeTool === "eraser") {
        const hit = doHitTest(pos);
        if (hit) removeAnnotation(hit.id);
        return;
      }

      // ── Fill mode ──
      if (activeTool === "fill") {
        const hit = doHitTest(pos);
        if (hit && hit.type === "form") {
          if (hit.fieldType === "checkbox") {
            updateAnnotation(hit.id, { checked: !hit.checked });
          } else {
            e.preventDefault();
            setEditingForm({
              id: hit.id,
              field: "value",
              x: hit.position.x,
              y: hit.position.y,
              w: hit.size.width,
              h: hit.size.height,
              text: hit.value,
            });
          }
        }
        return;
      }

      // ── Select mode ──
      if (activeTool === "select") {
        // Resize handles
        if (selectedId) {
          const selAnn = stateRef.current.pageAnnotations.find(
            (a) => a.id === selectedId,
          );
          if (
            selAnn &&
            (selAnn.type === "form" || selAnn.type === "highlight")
          ) {
            const corner = hitResizeHandle(
              pos,
              selAnn,
              stateRef.current.width,
              stateRef.current.height,
              stateRef.current.zoom,
            );
            if (corner) {
              const a = selAnn as FormAnnotation | HighlightAnnotation;
              initResize(a, corner, pos);
              return;
            }
          }
        }
        // Hit test annotations
        const hit = doHitTest(pos);
        setSelectedId(hit?.id ?? null);
        if (hit) {
          if (
            hit.type === "form" &&
            hit.fieldType === "checkbox" &&
            selectedId === hit.id
          ) {
            updateAnnotation(hit.id, { checked: !hit.checked });
            return;
          }
          initMove(hit.id, pos);
        }
        return;
      }

      // ── Form mode: click existing form field to select+move WITHOUT leaving form mode ──
      if (activeTool === "form") {
        const hit = doHitTest(pos);
        if (hit && hit.type === "form") {
          // Select it and allow move, but stay in form mode
          setSelectedId(hit.id);
          // Resize handles
          if (selectedId === hit.id) {
            const corner = hitResizeHandle(
              pos,
              hit,
              stateRef.current.width,
              stateRef.current.height,
              stateRef.current.zoom,
            );
            if (corner) {
              const a = hit as FormAnnotation;
              initResize(a, corner, pos);
              return;
            }
          }
          initMove(hit.id, pos);
          return;
        }
        // No form hit — start drawing a new form field
        dragRef.current = {
          kind: "rect",
          start: pos,
          current: pos,
          tool: "form",
        };
        return;
      }

      // ── Any tool: click existing annotation to select it ──
      {
        const hit = doHitTest(pos);
        if (hit) {
          setSelectedId(hit.id);
          initMove(hit.id, pos);
          return;
        }
      }

      if (activeTool === "text") {
        e.preventDefault(); // Prevent browser from interfering with textarea focus
        setEditingText({
          id: null,
          x: pos.x,
          y: pos.y,
          content: "",
          fontSize: textFontSize,
          color: textColor,
          bold: textBold,
          italic: textItalic,
          fontFamily: textFontFamily,
        });
        return;
      }
      if (activeTool === "draw") {
        dragRef.current = { kind: "draw", points: [pos] };
        return;
      }
      if (activeTool === "highlight") {
        dragRef.current = {
          kind: "rect",
          start: pos,
          current: pos,
          tool: "highlight",
        };
        return;
      }
    },
    [
      activeTool,
      editingText,
      editingForm,
      textFontSize,
      textColor,
      textBold,
      textItalic,
      textFontFamily,
      selectedId,
      getPos,
      setSelectedId,
      updateAnnotation,
      removeAnnotation,
    ],
  );

  // ── double-click ──────────────────────────────────────────────────
  const onDblClick = useCallback(
    (e: React.MouseEvent) => {
      if (editingText || editingForm) return;
      const pos = getPos(e);
      const hit = hitTest(
        pos,
        stateRef.current.pageAnnotations,
        stateRef.current.width,
        stateRef.current.height,
        stateRef.current.zoom,
      );
      if (!hit) return;
      if (hit.type === "text") {
        e.preventDefault();
        setEditingText({
          id: hit.id,
          x: hit.position.x,
          y: hit.position.y,
          content: hit.content,
          fontSize: hit.fontSize,
          color: hit.color,
          bold: hit.bold,
          italic: hit.italic,
          fontFamily: hit.fontFamily,
        });
      } else if (hit.type === "form") {
        if (hit.fieldType === "checkbox") {
          updateAnnotation(hit.id, { checked: !hit.checked });
        } else {
          setEditingForm({
            id: hit.id,
            field: "value",
            x: hit.position.x,
            y: hit.position.y,
            w: hit.size.width,
            h: hit.size.height,
            text: hit.value,
          });
        }
      }
    },
    [editingText, editingForm, getPos, updateAnnotation],
  );

  // ── mousemove ─────────────────────────────────────────────────────
  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getPos(e);
      const ds = dragRef.current;
      if (ds.kind === "draw") {
        ds.points.push(pos);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(renderOverlay);
      } else if (ds.kind === "rect") {
        ds.current = pos;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(renderOverlay);
      } else if (ds.kind === "move") {
        if (!ds.started) {
          if (
            Math.abs(pos.x - ds.mouseStart.x) < 0.008 &&
            Math.abs(pos.y - ds.mouseStart.y) < 0.008
          )
            return;
          ds.started = true;
          beginDrag();
          cachedEdgesRef.current = collectEdges(
            stateRef.current.pageAnnotations,
            ds.id,
            stateRef.current.width,
            stateRef.current.height,
            stateRef.current.zoom,
          );
        }

        const rawDx = pos.x - ds.mouseStart.x;
        const rawDy = pos.y - ds.mouseStart.y;
        const rawX = ds.annStartX + rawDx;
        const rawY = ds.annStartY + rawDy;

        const ann = stateRef.current.pageAnnotations.find(
          (a) => a.id === ds.id,
        );
        const b = ann
          ? getBBox(
              ann,
              stateRef.current.width,
              stateRef.current.height,
              stateRef.current.zoom,
            )
          : null;
        const curW = b ? b.w / stateRef.current.width : 0;
        const curH = b ? b.h / stateRef.current.height : 0;

        const edges = cachedEdgesRef.current ?? { xs: [], ys: [] };
        const snap = snapRect(rawX, rawY, curW, curH, edges);
        guidesRef.current = snap.guides;

        // Delta from CURRENT position to snapped position
        const curX = b ? b.x / stateRef.current.width : rawX;
        const curY = b ? b.y / stateRef.current.height : rawY;
        dragMove(ds.id, snap.x - curX, snap.y - curY);
      } else if (ds.kind === "resize") {
        if (!ds.started) {
          ds.started = true;
          beginDrag();
          cachedEdgesRef.current = collectEdges(
            stateRef.current.pageAnnotations,
            ds.id,
            stateRef.current.width,
            stateRef.current.height,
            stateRef.current.zoom,
          );
        }
        const dx = pos.x - ds.origin.x,
          dy = pos.y - ds.origin.y;
        const { origPos, origSize, corner } = ds;
        let newX = origPos.x,
          newY = origPos.y,
          newW = origSize.width,
          newH = origSize.height;
        if (corner === "br") {
          newW = origSize.width + dx;
          newH = origSize.height + dy;
        } else if (corner === "bl") {
          newX = origPos.x + dx;
          newW = origSize.width - dx;
          newH = origSize.height + dy;
        } else if (corner === "tr") {
          newW = origSize.width + dx;
          newY = origPos.y + dy;
          newH = origSize.height - dy;
        } else if (corner === "tl") {
          newX = origPos.x + dx;
          newY = origPos.y + dy;
          newW = origSize.width - dx;
          newH = origSize.height - dy;
        }
        if (newW < 0.02) {
          newW = 0.02;
          if (corner === "bl" || corner === "tl")
            newX = origPos.x + origSize.width - 0.02;
        }
        if (newH < 0.02) {
          newH = 0.02;
          if (corner === "tl" || corner === "tr")
            newY = origPos.y + origSize.height - 0.02;
        }

        const edges = cachedEdgesRef.current ?? { xs: [], ys: [] };
        const guides: SnapGuide[] = [];
        // Snap the moving edge(s)
        if (corner === "br" || corner === "tr") {
          const s = snapPos(newX + newW, edges.xs);
          if (s.guide !== null) {
            newW = s.snapped - newX;
            guides.push({ axis: "x", pos: s.guide });
          }
        }
        if (corner === "bl" || corner === "tl") {
          const s = snapPos(newX, edges.xs);
          if (s.guide !== null) {
            newW += newX - s.snapped;
            newX = s.snapped;
            guides.push({ axis: "x", pos: s.guide });
          }
        }
        if (corner === "br" || corner === "bl") {
          const s = snapPos(newY + newH, edges.ys);
          if (s.guide !== null) {
            newH = s.snapped - newY;
            guides.push({ axis: "y", pos: s.guide });
          }
        }
        if (corner === "tl" || corner === "tr") {
          const s = snapPos(newY, edges.ys);
          if (s.guide !== null) {
            newH += newY - s.snapped;
            newY = s.snapped;
            guides.push({ axis: "y", pos: s.guide });
          }
        }
        guidesRef.current = guides;

        dragResize(ds.id, { x: newX, y: newY }, { width: newW, height: newH });
      }
    },
    [getPos, renderOverlay, beginDrag, dragMove, dragResize],
  );

  // ── mouseup ───────────────────────────────────────────────────────
  const onUp = useCallback(() => {
    const ds = dragRef.current;
    guidesRef.current = [];
    cachedEdgesRef.current = null;

    if (ds.kind === "draw") {
      if (ds.points.length > 1) {
        addAnnotation({
          id: nanoid(),
          type: "draw",
          pageIndex,
          points: [...ds.points],
          color: stateRef.current.drawColor,
          lineWidth: stateRef.current.drawLineWidth,
        });
      }
    } else if (ds.kind === "rect") {
      const s = ds.start,
        c = ds.current;
      const dragW = Math.abs(c.x - s.x),
        dragH = Math.abs(c.y - s.y);
      const wasDragged = dragW > 0.02 && dragH > 0.01;

      if (ds.tool === "highlight") {
        if (wasDragged) {
          const pos = { x: Math.min(s.x, c.x), y: Math.min(s.y, c.y) };
          addAnnotation({
            id: nanoid(),
            type: "highlight",
            pageIndex,
            position: pos,
            size: { width: dragW, height: dragH },
            color: stateRef.current.highlightColor,
            opacity: 0.35,
          });
        }
      } else {
        const ft = usePDFEditorStore.getState().activeFormType;
        const defaultW = ft === "checkbox" ? 0.04 : 0.25;
        const defaultH = ft === "checkbox" ? 0.04 : 0.04;
        const fw = wasDragged ? dragW : defaultW;
        const fh = wasDragged ? dragH : defaultH;
        const pos = wasDragged
          ? { x: Math.min(s.x, c.x), y: Math.min(s.y, c.y) }
          : { x: s.x, y: s.y };
        const fid = nanoid();
        addAnnotation({
          id: fid,
          type: "form",
          fieldType: ft,
          pageIndex,
          position: pos,
          size: { width: fw, height: fh },
          label: "",
          value: "",
          checked: false,
        });
      }
    }
    dragRef.current = IDLE;
    // Re-render to clear guides
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderOverlay);
  }, [pageIndex, addAnnotation, renderOverlay]);

   
  const finalizeText = useCallback(() => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    queueMicrotask(() => {
      finalizingRef.current = false;
    });
    const et = editingText;
    if (!et) return;
    const content = (textareaRef.current?.value ?? et.content).trim();
    if (content) {
      if (et.id) updateAnnotation(et.id, { content });
      else {
        const s = usePDFEditorStore.getState();
        addAnnotation({
          id: nanoid(),
          type: "text",
          pageIndex,
          position: { x: et.x, y: et.y },
          content,
          fontSize: et.fontSize,
          color: et.color,
          bold: s.textBold,
          italic: s.textItalic,
          fontFamily: s.textFontFamily,
        });
      }
    }
    setEditingText(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editingText read inside is intentionally excluded; callback is stored in a ref
  }, [pageIndex, addAnnotation, updateAnnotation]);

  const formInputRef = useRef<HTMLInputElement>(null);
   
  const finalizeForm = useCallback(() => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    queueMicrotask(() => {
      finalizingRef.current = false;
    });
    const ef = editingForm;
    if (!ef) return;
    const val = (formInputRef.current?.value ?? ef.text).trim();
    if (ef.field === "label")
      updateAnnotation(ef.id, { label: val || "Field" });
    else updateAnnotation(ef.id, { value: val });
    setEditingForm(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editingForm read inside is intentionally excluded; callback is stored in a ref
  }, [updateAnnotation]);
  useEffect(() => {
    finalizeTextRef.current = finalizeText;
  }, [finalizeText]);
  useEffect(() => {
    finalizeFormRef.current = finalizeForm;
  }, [finalizeForm]);

  useEffect(() => {
    if (editingText) textareaRef.current?.focus();
  }, [editingText]);

  const cursor =
    activeTool === "text"
      ? "crosshair"
      : activeTool === "draw" ||
          activeTool === "highlight" ||
          activeTool === "form"
        ? "crosshair"
        : activeTool === "fill"
          ? "pointer"
          : activeTool === "eraser"
            ? "pointer"
            : "default";

  return (
    <div className="relative rounded-sm shadow-lg" style={{ width, height }}>
      <canvas ref={pdfCanvasRef} className="absolute inset-0" />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0"
        style={{ zIndex: 10, pointerEvents: "none" }}
      />
      <div
        ref={interactionRef}
        className="absolute inset-0"
        style={{ zIndex: 15, cursor }}
        onMouseDown={onDown}
        onDoubleClick={onDblClick}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      />

      {/* Label button — real DOM element, no coordinate math for clicks */}
      {selectedId &&
        !editingForm &&
        pageAnnotations
          .filter((a) => a.type === "form" && a.id === selectedId)
          .map((ann) => {
            const a = ann as FormAnnotation;
            return (
              <button
                key={`label-${a.id}`}
                className="absolute rounded-t border border-b-0 border-gray-300 px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  left: a.position.x * width,
                  top: a.position.y * height - 18,
                  zIndex: 25,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingForm({
                    id: a.id,
                    field: "label",
                    x: a.position.x,
                    y: a.position.y,
                    w: a.size.width,
                    h: a.size.height,
                    text: a.label,
                  });
                }}
              >
                {a.label || "Add label..."}
              </button>
            );
          })}

      {editingText && (
        <textarea
          ref={textareaRef}
          autoFocus
          className="absolute resize-none rounded border border-gray-300 p-1 shadow-sm outline-none"
          style={{
            left: editingText.x * width,
            top: editingText.y * height,
            fontSize: editingText.fontSize * zoom,
            color: editingText.color,
            fontWeight: textBold ? "bold" : "normal",
            fontStyle: textItalic ? "italic" : "normal",
            fontFamily: textFontFamily || "sans-serif",
            zIndex: 30,
            minWidth: 120,
            minHeight: Math.max(28, editingText.fontSize * zoom * 2),
            lineHeight: 1.3,
          }}
          value={editingText.content}
          onChange={(e) =>
            setEditingText({ ...editingText, content: e.target.value })
          }
          onBlur={finalizeText}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditingText(null);
            if ((e.metaKey || e.ctrlKey) && e.key === "b") {
              e.preventDefault();
              usePDFEditorStore
                .getState()
                .setTextBold(!usePDFEditorStore.getState().textBold);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "i") {
              e.preventDefault();
              usePDFEditorStore
                .getState()
                .setTextItalic(!usePDFEditorStore.getState().textItalic);
            }
            e.stopPropagation();
          }}
        />
      )}

      {editingForm && (
        <input
          ref={formInputRef}
          autoFocus
          className={cn(
            "absolute outline-none",
            editingForm.field === "label"
              ? "rounded-t bg-muted px-1 text-muted-foreground"
              : "border border-gray-300 text-black shadow-sm",
          )}
          style={{
            left: editingForm.x * width,
            top:
              editingForm.field === "label"
                ? editingForm.y * height - (Math.max(8, 9 * zoom) + 4)
                : editingForm.y * height,
            width:
              editingForm.field === "label" ? undefined : editingForm.w * width,
            height:
              editingForm.field === "label"
                ? Math.max(8, 9 * zoom) + 4
                : editingForm.h * height,
            zIndex: 30,
            minWidth: editingForm.field === "label" ? 60 : undefined,
            fontSize:
              editingForm.field === "label"
                ? Math.max(8, 9 * zoom)
                : Math.max(9, 12 * zoom),
            paddingLeft: editingForm.field === "label" ? 4 : 8,
          }}
          placeholder={
            editingForm.field === "label" ? "Label..." : "Type value..."
          }
          value={editingForm.text}
          onChange={(e) =>
            setEditingForm({ ...editingForm, text: e.target.value })
          }
          onBlur={finalizeForm}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") finalizeForm();
            e.stopPropagation();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Canvas rendering helpers
// ═══════════════════════════════════════════════════════════════════

function drawStroke(
  ctx: CanvasRenderingContext2D,
  a: DrawAnnotation,
  w: number,
  h: number,
  z: number,
) {
  if (a.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = a.color;
  ctx.lineWidth = a.lineWidth * z;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(a.points[0].x * w, a.points[0].y * h);
  for (let i = 1; i < a.points.length; i++)
    ctx.lineTo(a.points[i].x * w, a.points[i].y * h);
  ctx.stroke();
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  a: HighlightAnnotation,
  w: number,
  h: number,
) {
  const alpha = Math.round(a.opacity * 255)
    .toString(16)
    .padStart(2, "0");
  ctx.fillStyle = a.color + alpha;
  ctx.fillRect(
    a.position.x * w,
    a.position.y * h,
    a.size.width * w,
    a.size.height * h,
  );
}

function drawText(
  ctx: CanvasRenderingContext2D,
  a: TextAnnotation,
  w: number,
  h: number,
  z: number,
) {
  const fs = a.fontSize * z;
  const weight = a.bold ? "bold" : "normal";
  const style = a.italic ? "italic" : "normal";
  const family = a.fontFamily || "sans-serif";
  ctx.font = `${style} ${weight} ${fs}px ${family}`;
  ctx.fillStyle = a.color;
  ctx.textBaseline = "top";
  const lines = a.content.split("\n");
  let y = a.position.y * h;
  for (const line of lines) {
    ctx.fillText(line, a.position.x * w, y);
    y += fs * 1.3;
  }
}

function drawFormField(
  ctx: CanvasRenderingContext2D,
  a: FormAnnotation,
  w: number,
  h: number,
  z: number,
) {
  const x = a.position.x * w,
    y = a.position.y * h;
  const bw = a.size.width * w,
    bh = a.size.height * h;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, bw, bh);
  ctx.clip();

  // Shared field box style — light transparent bg with subtle border
  const drawBox = () => {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
  };
  const fs = Math.max(9, 12 * z);

  switch (a.fieldType) {
    case "checkbox": {
      const sz = Math.min(bw, bh);
      ctx.fillStyle = a.checked ? "#2563eb" : "rgba(255,255,255,0.5)";
      ctx.fillRect(x, y, sz, sz);
      ctx.strokeStyle = a.checked ? "#2563eb" : "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
      if (a.checked) {
        ctx.beginPath();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(x + sz * 0.22, y + sz * 0.5);
        ctx.lineTo(x + sz * 0.42, y + sz * 0.72);
        ctx.lineTo(x + sz * 0.78, y + sz * 0.3);
        ctx.stroke();
      }
      break;
    }
    case "dropdown": {
      drawBox();
      ctx.font = `${fs}px system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = a.value ? "#1e293b" : "#9ca3af";
      ctx.fillText(a.value || "Select...", x + 6, y + bh / 2);
      // Chevron
      const cx = x + bw - 14,
        cy = y + bh / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 2);
      ctx.lineTo(cx, cy + 2);
      ctx.lineTo(cx + 3, cy - 2);
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.stroke();
      break;
    }
    case "signature": {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
      ctx.setLineDash([]);
      // Baseline
      ctx.beginPath();
      ctx.moveTo(x + 8, y + bh - 8);
      ctx.lineTo(x + bw - 8, y + bh - 8);
      ctx.strokeStyle = "#d1d5db";
      ctx.stroke();
      ctx.font = a.value
        ? `italic ${Math.max(9, 14 * z)}px cursive, sans-serif`
        : `${Math.max(8, 10 * z)}px system-ui, sans-serif`;
      ctx.fillStyle = a.value ? "#1e293b" : "#9ca3af";
      ctx.textBaseline = a.value ? "bottom" : "middle";
      ctx.fillText(
        a.value || "Sign here",
        a.value ? x + 10 : x + 8,
        a.value ? y + bh - 10 : y + bh / 2 - 4,
      );
      break;
    }
    default: {
      // text + date
      drawBox();
      ctx.font = `${fs}px system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = a.value ? "#1e293b" : "#9ca3af";
      const placeholder =
        a.fieldType === "date" ? "MM / DD / YYYY" : "Type here...";
      ctx.fillText(a.value || placeholder, x + 6, y + bh / 2);
      break;
    }
  }
  ctx.restore();
}

function drawFormPreview(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  ann: Annotation,
  w: number,
  h: number,
  z: number,
) {
  const bbox = getBBox(ann, w, h, z);
  if (!bbox) return;
  const p = 3;
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(bbox.x - p, bbox.y - p, bbox.w + p * 2, bbox.h + p * 2);
  ctx.setLineDash([]);
  if (ann.type === "form" || ann.type === "highlight") {
    const hs = HANDLE_SIZE;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    const corners = [
      [bbox.x - p - hs / 2, bbox.y - p - hs / 2],
      [bbox.x + bbox.w + p - hs / 2, bbox.y - p - hs / 2],
      [bbox.x - p - hs / 2, bbox.y + bbox.h + p - hs / 2],
      [bbox.x + bbox.w + p - hs / 2, bbox.y + bbox.h + p - hs / 2],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx, cy, hs, hs);
      ctx.strokeRect(cx, cy, hs, hs);
    }
  }
}

function getBBox(ann: Annotation, w: number, h: number, z: number) {
  switch (ann.type) {
    case "text": {
      const fs = ann.fontSize * z;
      const lines = ann.content.split("\n");
      const maxLen = Math.max(...lines.map((l) => l.length));
      return {
        x: ann.position.x * w,
        y: ann.position.y * h,
        w: maxLen * fs * 0.6,
        h: lines.length * fs * 1.3,
      };
    }
    case "draw": {
      if (!ann.points.length) return null;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of ann.points) {
        minX = Math.min(minX, p.x * w);
        minY = Math.min(minY, p.y * h);
        maxX = Math.max(maxX, p.x * w);
        maxY = Math.max(maxY, p.y * h);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case "highlight":
    case "form":
      return {
        x: ann.position.x * w,
        y: ann.position.y * h,
        w: ann.size.width * w,
        h: ann.size.height * h,
      };
  }
}

function hitResizeHandle(
  pos: Point,
  ann: Annotation,
  w: number,
  h: number,
  z: number,
): Corner | null {
  const bbox = getBBox(ann, w, h, z);
  if (!bbox) return null;
  const px = pos.x * w,
    py = pos.y * h;
  const p = 3,
    hs = HANDLE_SIZE + 4;
  const corners: [number, number, Corner][] = [
    [bbox.x - p, bbox.y - p, "tl"],
    [bbox.x + bbox.w + p, bbox.y - p, "tr"],
    [bbox.x - p, bbox.y + bbox.h + p, "bl"],
    [bbox.x + bbox.w + p, bbox.y + bbox.h + p, "br"],
  ];
  for (const [cx, cy, corner] of corners) {
    if (Math.abs(px - cx) < hs && Math.abs(py - cy) < hs) return corner;
  }
  return null;
}

function hitTest(
  pos: Point,
  anns: Annotation[],
  w: number,
  h: number,
  z: number,
): Annotation | null {
  for (let i = anns.length - 1; i >= 0; i--) {
    const bbox = getBBox(anns[i], w, h, z);
    if (!bbox) continue;
    const px = pos.x * w,
      py = pos.y * h,
      pad = 6;
    if (
      px >= bbox.x - pad &&
      px <= bbox.x + bbox.w + pad &&
      py >= bbox.y - pad &&
      py <= bbox.y + bbox.h + pad
    )
      return anns[i];
  }
  return null;
}
