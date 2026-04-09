/// <reference lib="webworker" />

import Pica from "pica";
import type { ProcessMessage, WorkerResponse, OutputFormat } from "../types";

/**
 * Image processing worker.
 *
 * Resizing: Pica (Lanczos3/mks2013 filter — Squoosh-level quality)
 * Encoding: OffscreenCanvas.convertToBlob (JPEG, PNG, WebP, AVIF)
 *
 * Pica configured with:
 *   - createCanvas → OffscreenCanvas (Worker-compatible)
 *   - features: ['js'] — pure JS, no sub-workers (Turbopack safe)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pica = new (Pica as any)({
  features: ["js"],
  createCanvas: (w: number, h: number) => new OffscreenCanvas(w, h),
});

function computeTargetDimensions(msg: ProcessMessage): {
  width: number;
  height: number;
} {
  const { mode, width, height, percent, originalWidth, originalHeight } =
    msg.resize;

  if (mode === "none") {
    return { width: originalWidth, height: originalHeight };
  }

  if (mode === "percentage") {
    const scale = percent / 100;
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    };
  }

  if (mode === "exact" || mode === "preset") {
    if (width && !height) {
      const ratio = originalHeight / originalWidth;
      return { width, height: Math.round(width * ratio) };
    }
    if (!width && height) {
      const ratio = originalWidth / originalHeight;
      return { width: Math.round(height * ratio), height };
    }
    if (width && height) {
      return { width, height };
    }
  }

  return { width: originalWidth, height: originalHeight };
}

function formatToMime(format: OutputFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
  }
}

async function tryConvertToBlob(
  canvas: OffscreenCanvas,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const mime = formatToMime(format);
  const q = format === "png" ? undefined : quality / 100;

  try {
    return await canvas.convertToBlob({ type: mime, quality: q });
  } catch {
    // AVIF may not be supported — fall back to WebP
    if (format === "avif") {
      return canvas.convertToBlob({ type: "image/webp", quality: q });
    }
    throw new Error(`Format ${format} is not supported by this browser`);
  }
}

self.onmessage = async (e: MessageEvent<ProcessMessage>) => {
  const msg = e.data;
  if (msg.type !== "process") return;

  try {
    // 1. Decode
    self.postMessage({
      type: "progress",
      fileId: msg.fileId,
      stage: "decoding",
    } satisfies WorkerResponse);

    const blob = new Blob([msg.imageData]);
    const bitmap = await createImageBitmap(blob);

    // Draw source to OffscreenCanvas (Pica needs canvas input)
    const srcCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    srcCanvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();

    // 2. Resize with Pica (Lanczos3 quality)
    const dims = computeTargetDimensions(msg);
    const needsResize =
      dims.width !== srcCanvas.width || dims.height !== srcCanvas.height;

    let outputCanvas: OffscreenCanvas;

    if (needsResize) {
      self.postMessage({
        type: "progress",
        fileId: msg.fileId,
        stage: "resizing",
      } satisfies WorkerResponse);

      const dstCanvas = new OffscreenCanvas(dims.width, dims.height);
      await pica.resize(srcCanvas, dstCanvas);
      outputCanvas = dstCanvas;
    } else {
      outputCanvas = srcCanvas;
    }

    // 3. Flatten transparency to white for JPEG
    if (msg.targetFormat === "jpeg") {
      const ctx = outputCanvas.getContext("2d")!;
      const imageData = ctx.getImageData(
        0,
        0,
        outputCanvas.width,
        outputCanvas.height,
      );
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        data[i] = Math.round(data[i] * alpha + 255 * (1 - alpha));
        data[i + 1] = Math.round(data[i + 1] * alpha + 255 * (1 - alpha));
        data[i + 2] = Math.round(data[i + 2] * alpha + 255 * (1 - alpha));
        data[i + 3] = 255;
      }
      const flat = new OffscreenCanvas(outputCanvas.width, outputCanvas.height);
      flat.getContext("2d")!.putImageData(imageData, 0, 0);
      outputCanvas = flat;
    }

    // 4. Encode
    self.postMessage({
      type: "progress",
      fileId: msg.fileId,
      stage: "encoding",
    } satisfies WorkerResponse);

    let encoded: Blob;
    let actualQuality: number | null = null;

    if (
      msg.targetSizeKB &&
      msg.targetFormat !== "png" // PNG is lossless, no quality knob
    ) {
      // Binary search for highest quality under target size
      const targetBytes = msg.targetSizeKB * 1024;
      let lo = 1;
      let hi = 100;
      let bestBlob: Blob | null = null;
      let bestQ = 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const attempt = await tryConvertToBlob(
          outputCanvas,
          msg.targetFormat,
          mid,
        );
        if (attempt.size <= targetBytes) {
          bestBlob = attempt;
          bestQ = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      encoded =
        bestBlob ?? (await tryConvertToBlob(outputCanvas, msg.targetFormat, 1));
      actualQuality = bestQ;
    } else {
      encoded = await tryConvertToBlob(
        outputCanvas,
        msg.targetFormat,
        msg.quality,
      );
    }

    const arrayBuffer = await encoded.arrayBuffer();

    const result: WorkerResponse = {
      type: "result",
      fileId: msg.fileId,
      data: arrayBuffer,
      width: dims.width,
      height: dims.height,
      format: msg.targetFormat,
      actualQuality,
    };
    self.postMessage(result, [arrayBuffer]);
  } catch (err) {
    const error: WorkerResponse = {
      type: "error",
      fileId: msg.fileId,
      message: err instanceof Error ? err.message : "Processing failed",
    };
    self.postMessage(error);
  }
};
