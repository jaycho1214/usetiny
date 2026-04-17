const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return VIDEO_ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;
      const match = url.pathname.match(
        /^\/(?:embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/,
      );
      if (match) return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export function nextRate(current: number, direction: 1 | -1): PlaybackRate {
  const rates = PLAYBACK_RATES as readonly number[];
  const idx = rates.findIndex((r) => Math.abs(r - current) < 0.01);
  const safeIdx = idx === -1 ? rates.indexOf(1) : idx;
  const nextIdx = Math.min(rates.length - 1, Math.max(0, safeIdx + direction));
  return PLAYBACK_RATES[nextIdx];
}
