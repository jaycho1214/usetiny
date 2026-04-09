import type { OutputFormat, ResizePreset, ImagePreset } from "./types";

export const SUPPORTED_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/tiff",
];

export const ACCEPT_STRING =
  ".jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.tiff,.tif,image/*";

export const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

export const MAX_FILES = 50;
export const THUMBNAIL_SIZE = 80;
export const QUALITY_DEBOUNCE_MS = 300;

export const RESIZE_PRESETS: ResizePreset[] = [
  { id: "hd", name: "HD (1920 x 1080)", width: 1920, height: 1080 },
  { id: "720p", name: "720p (1280 x 720)", width: 1280, height: 720 },
  { id: "vga", name: "VGA (640 x 480)", width: 640, height: 480 },
  { id: "square-512", name: "Square (512 x 512)", width: 512, height: 512 },
  {
    id: "ig-square",
    name: "Instagram Square (1080 x 1080)",
    width: 1080,
    height: 1080,
  },
  {
    id: "ig-story",
    name: "Instagram Story (1080 x 1920)",
    width: 1080,
    height: 1920,
  },
  {
    id: "twitter-post",
    name: "Twitter Post (1200 x 675)",
    width: 1200,
    height: 675,
  },
  {
    id: "fb-cover",
    name: "Facebook Cover (820 x 312)",
    width: 820,
    height: 312,
  },
  { id: "thumb", name: "Thumbnail (150 x 150)", width: 150, height: 150 },
  { id: "favicon", name: "Favicon (32 x 32)", width: 32, height: 32 },
];

export const BUILTIN_PRESETS: ImagePreset[] = [
  {
    id: "web",
    name: "Web",
    format: "webp",
    quality: 80,
    resizeMode: "none",
    resizeWidth: null,
    resizeHeight: null,
    resizePercent: 100,
  },
  {
    id: "email",
    name: "Email",
    format: "jpeg",
    quality: 70,
    resizeMode: "exact",
    resizeWidth: 1024,
    resizeHeight: null,
    resizePercent: 100,
  },
  {
    id: "social",
    name: "Social",
    format: "jpeg",
    quality: 85,
    resizeMode: "none",
    resizeWidth: null,
    resizeHeight: null,
    resizePercent: 100,
  },
  {
    id: "lossless",
    name: "Lossless",
    format: "png",
    quality: 100,
    resizeMode: "none",
    resizeWidth: null,
    resizeHeight: null,
    resizePercent: 100,
  },
];

export function computeSavings(
  original: number,
  processed: number,
): number | null {
  if (original <= 0) return null;
  return Math.round(((original - processed) / original) * 100);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mimeToFormat(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
    "image/tiff": "tiff",
  };
  return map[mime] ?? "unknown";
}

export function formatToMime(format: OutputFormat): string {
  const map: Record<OutputFormat, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return map[format];
}

/** Recursively read all files from FileSystemEntry trees (folder drop support) */
export async function readAllFiles(
  entries: FileSystemEntry[],
  out: File[],
): Promise<void> {
  for (const entry of entries) {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      out.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const children = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      await readAllFiles(children, out);
    }
  }
}

export function filterImageFiles(files: File[], currentCount: number): File[] {
  const valid = files.filter((f) => SUPPORTED_INPUT_TYPES.includes(f.type));
  if (valid.length === 0) return [];
  const remaining = MAX_FILES - currentCount;
  if (valid.length > remaining) return valid.slice(0, remaining);
  return valid;
}

export function openImagePicker(currentCount: number): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT_STRING;
    input.multiple = true;
    input.onchange = () => {
      if (!input.files) return resolve([]);
      const valid: File[] = [];
      for (const file of Array.from(input.files)) {
        if (SUPPORTED_INPUT_TYPES.includes(file.type)) valid.push(file);
      }
      const remaining = MAX_FILES - currentCount;
      if (valid.length > remaining) valid.splice(remaining);
      resolve(valid);
    };
    input.click();
  });
}

export function formatToExt(format: OutputFormat): string {
  const map: Record<OutputFormat, string> = {
    jpeg: ".jpg",
    png: ".png",
    webp: ".webp",
    avif: ".avif",
  };
  return map[format];
}
