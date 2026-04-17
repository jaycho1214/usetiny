export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function extractTitle(markdown: string): string {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match) return sanitizeFilename(match[1]);
  }
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i].trim();
    const next = lines[i + 1].trim();
    if (current && (/^=+$/.test(next) || /^-+$/.test(next))) {
      return sanitizeFilename(current);
    }
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return sanitizeFilename(trimmed);
  }
  return "";
}

export async function exportPdf(markdown: string, userFilename: string) {
  const filename = (
    sanitizeFilename(userFilename.trim()) ||
    extractTitle(markdown) ||
    "document"
  ).replace(/\.pdf$/i, "");

  const originalTitle = document.title;
  document.title = filename;
  const restore = () => {
    document.title = originalTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
