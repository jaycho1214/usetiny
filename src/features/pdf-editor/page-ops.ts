import { PDFDocument, degrees as pdfDegrees } from "pdf-lib";
import type { Annotation } from "./types";
import { toArrayBuffer } from "./utils";

export async function duplicatePage(
  pdfData: ArrayBuffer,
  pageIndex: number
): Promise<{ data: ArrayBuffer; totalPages: number; updateAnnotations: (anns: Annotation[]) => Annotation[] }> {
  const doc = await PDFDocument.load(pdfData);
  const [copied] = await doc.copyPages(doc, [pageIndex]);
  doc.insertPage(pageIndex + 1, copied);
  const data = toArrayBuffer(await doc.save());
  return {
    data,
    totalPages: doc.getPageCount(),
    updateAnnotations: (anns) => {
      // Shift annotations on pages after the duplicated page
      const shifted = anns.map((a) =>
        a.pageIndex > pageIndex ? { ...a, pageIndex: a.pageIndex + 1 } : a
      );
      // Copy annotations from the original page to the new page
      const copies = anns
        .filter((a) => a.pageIndex === pageIndex)
        .map((a) => ({ ...a, id: crypto.randomUUID(), pageIndex: pageIndex + 1 }));
      return [...shifted, ...copies] as Annotation[];
    },
  };
}

export async function deletePage(
  pdfData: ArrayBuffer,
  pageIndex: number
): Promise<{ data: ArrayBuffer; totalPages: number; updateAnnotations: (anns: Annotation[]) => Annotation[] }> {
  const doc = await PDFDocument.load(pdfData);
  if (doc.getPageCount() <= 1) throw new Error("Cannot delete the only page");
  doc.removePage(pageIndex);
  const data = toArrayBuffer(await doc.save());
  return {
    data,
    totalPages: doc.getPageCount(),
    updateAnnotations: (anns) =>
      anns
        .filter((a) => a.pageIndex !== pageIndex)
        .map((a) => (a.pageIndex > pageIndex ? { ...a, pageIndex: a.pageIndex - 1 } : a)) as Annotation[],
  };
}

export async function rotatePage(
  pdfData: ArrayBuffer,
  pageIndex: number,
  degrees: 90 | 180 | 270 = 90
): Promise<{ data: ArrayBuffer; totalPages: number; updateAnnotations: (anns: Annotation[]) => Annotation[] }> {
  const doc = await PDFDocument.load(pdfData);
  const page = doc.getPage(pageIndex);
  const current = page.getRotation().angle;
  page.setRotation(pdfDegrees((current + degrees) % 360));
  const data = toArrayBuffer(await doc.save());
  return {
    data,
    totalPages: doc.getPageCount(),
    updateAnnotations: (anns) => anns, // Keep annotations as-is; positions may need manual adjustment
  };
}

export async function movePageUp(
  pdfData: ArrayBuffer,
  pageIndex: number
): Promise<{ data: ArrayBuffer; totalPages: number; updateAnnotations: (anns: Annotation[]) => Annotation[] }> {
  if (pageIndex <= 0) throw new Error("Already first page");
  const doc = await PDFDocument.load(pdfData);
  const [page] = await doc.copyPages(doc, [pageIndex]);
  doc.removePage(pageIndex);
  doc.insertPage(pageIndex - 1, page);
  const data = toArrayBuffer(await doc.save());
  return {
    data,
    totalPages: doc.getPageCount(),
    updateAnnotations: (anns) =>
      anns.map((a) => {
        if (a.pageIndex === pageIndex) return { ...a, pageIndex: pageIndex - 1 };
        if (a.pageIndex === pageIndex - 1) return { ...a, pageIndex: pageIndex };
        return a;
      }) as Annotation[],
  };
}

export async function movePageDown(
  pdfData: ArrayBuffer,
  pageIndex: number,
  totalPages: number
): Promise<{ data: ArrayBuffer; totalPages: number; updateAnnotations: (anns: Annotation[]) => Annotation[] }> {
  if (pageIndex >= totalPages - 1) throw new Error("Already last page");
  const doc = await PDFDocument.load(pdfData);
  const [page] = await doc.copyPages(doc, [pageIndex]);
  doc.removePage(pageIndex);
  doc.insertPage(pageIndex + 1, page);
  const data = toArrayBuffer(await doc.save());
  return {
    data,
    totalPages: doc.getPageCount(),
    updateAnnotations: (anns) =>
      anns.map((a) => {
        if (a.pageIndex === pageIndex) return { ...a, pageIndex: pageIndex + 1 };
        if (a.pageIndex === pageIndex + 1) return { ...a, pageIndex: pageIndex };
        return a;
      }) as Annotation[],
  };
}
