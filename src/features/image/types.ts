export type OutputFormat = "jpeg" | "png" | "webp" | "avif";

export type QualityMode = "manual" | "target";

export type ResizeMode = "none" | "exact" | "percentage" | "preset";

export interface ResizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface ExifData {
  make: string | null;
  model: string | null;
  dateTaken: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  width: number;
  height: number;
  iso: number | null;
  aperture: string | null;
  shutterSpeed: string | null;
  focalLength: string | null;
  copyright: string | null;
  orientation: number | null;
}

export interface ImagePreset {
  id: string;
  name: string;
  format: OutputFormat;
  quality: number;
  resizeMode: ResizeMode;
  resizeWidth: number | null;
  resizeHeight: number | null;
  resizePercent: number;
}

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  thumbnailUrl: string;
  originalUrl: string;
  exifData: ExifData | null;

  // Processing results
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedSize: number | null;
  processedWidth: number | null;
  processedHeight: number | null;

  // Per-file overrides (null = use global settings)
  overrideFormat: OutputFormat | null;
  overrideQuality: number | null;

  // State
  status: "pending" | "processing" | "done" | "error";
  error: string | null;
}

// Worker messages
export interface ProcessMessage {
  type: "process";
  fileId: string;
  imageData: ArrayBuffer;
  sourceFormat: string;
  targetFormat: OutputFormat;
  quality: number;
  targetSizeKB: number | null;
  resize: {
    mode: ResizeMode;
    width: number | null;
    height: number | null;
    percent: number;
    originalWidth: number;
    originalHeight: number;
  };
}

export interface ProcessResult {
  type: "result";
  fileId: string;
  data: ArrayBuffer;
  width: number;
  height: number;
  format: OutputFormat;
  actualQuality: number | null;
}

export interface ProcessError {
  type: "error";
  fileId: string;
  message: string;
}

export interface ProcessProgress {
  type: "progress";
  fileId: string;
  stage: "decoding" | "resizing" | "encoding";
}

export type WorkerMessage = ProcessMessage;
export type WorkerResponse = ProcessResult | ProcessError | ProcessProgress;
