// Lazy, theme-aware wrapper around mermaid. Keeps mermaid (large) out of the
// initial bundle: it is only imported when a diagram is actually rendered.

export type MermaidTheme = "default" | "dark";
export type MermaidRenderResult = { svg: string } | { error: string };

type MermaidModule = (typeof import("mermaid"))["default"];

let mermaidPromise: Promise<MermaidModule> | null = null;
let lastTheme: MermaidTheme | null = null;
let idCounter = 0;

// Cache rendered SVGs so unchanged diagrams don't re-render on every
// debounced keystroke. Keyed by theme + source.
const svgCache = new Map<string, string>();

function loadMermaid(): Promise<MermaidModule> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => mod.default);
  }
  return mermaidPromise;
}

export async function renderMermaid(
  source: string,
  theme: MermaidTheme,
): Promise<MermaidRenderResult> {
  const cacheKey = `${theme}:${source}`;
  const cached = svgCache.get(cacheKey);
  if (cached) return { svg: cached };

  try {
    const mermaid = await loadMermaid();

    // mermaid bakes the theme at initialize() time, so re-init on theme change.
    if (lastTheme !== theme) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme,
      });
      lastTheme = theme;
    }

    const id = `mermaid-render-${idCounter++}`;
    const { svg } = await mermaid.render(id, source);
    svgCache.set(cacheKey, svg);
    return { svg };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to render diagram";
    return { error: message };
  }
}
