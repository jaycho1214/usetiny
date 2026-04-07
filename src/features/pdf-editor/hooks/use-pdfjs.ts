"use client";

import { useEffect, useState } from "react";
import type * as PdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof PdfjsLib> | null = null;

function loadPdfjs(): Promise<typeof PdfjsLib> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // Use unpkg CDN — auto-matches the installed pdfjs-dist version
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export function usePdfjs() {
  const [pdfjs, setPdfjs] = useState<typeof PdfjsLib | null>(null);

  useEffect(() => {
    loadPdfjs().then(setPdfjs);
  }, []);

  return pdfjs;
}

export function usePdfDocument(data: ArrayBuffer | null) {
  const pdfjs = usePdfjs();
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!pdfjs || !data) return;

    let cancelled = false;
    const loadingTask = pdfjs.getDocument({ data: data.slice(0) });

    loadingTask.promise.then(
      (pdf) => {
        if (!cancelled) setDoc(pdf);
      },
      (err) => {
        if (!cancelled) console.error("Failed to load PDF:", err);
      },
    );

    return () => {
      cancelled = true;
      loadingTask.destroy();
      setDoc(null);
    };
  }, [pdfjs, data]);

  return doc;
}
