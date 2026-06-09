# Mermaid rendering in the Markdown tool

**Date:** 2026-06-09
**Scope:** `/markdown` only. (Rich-text was considered and explicitly dropped.)

## Goal

Render ` ```mermaid ` fenced code blocks in the Markdown preview as live SVG
diagrams that follow the app's light/dark theme, instead of showing them as
syntax-highlighted code.

## Context

The Markdown preview (`src/features/markdown/components/markdown-preview.tsx`)
runs a synchronous `unified` pipeline:

```
remarkParse → remarkGfm → remarkMath → remarkRehype → rehypeKatex
→ rehypeHighlight({ detect: true }) → rehypeStringify
```

and injects the result via `dangerouslySetInnerHTML`. PDF export is
`window.print()` of that same preview DOM (`export-pdf.tsx`), so anything that
renders in the preview also prints.

Mermaid v11 API (verified via context7):

- `mermaid.initialize({ startOnLoad: false, securityLevel, theme, suppressErrorRendering })`
- `const { svg } = await mermaid.render(id, source)` — async, returns the SVG
  string, throws on parse error. `id` must be a unique valid DOM id (mermaid
  uses a temporary element keyed by it during layout).

## Architecture

### 1. Shared render helper — `src/lib/mermaid.ts`

All mermaid concerns live in one module:

- **Singleton lazy import:** `import("mermaid")` is invoked once and memoized at
  module scope, keeping mermaid (large) out of the initial bundle. It only
  loads when a diagram is actually present.
- **Initialization:** `initialize({ startOnLoad: false, securityLevel: "strict",
  suppressErrorRendering: true, theme })`.
  - `securityLevel: "strict"` sanitizes diagram labels — safe for arbitrary
    user input.
  - `suppressErrorRendering: true` stops mermaid from injecting its own error
    diagram into the DOM, so we control the failure UI.
- **API:** `renderMermaid(id: string, source: string, theme: "default" | "dark")
  → Promise<{ svg: string } | { error: string }>`.
  - Re-calls `initialize` when the requested theme differs from the last one
    used (mermaid bakes theme at init time).
  - Wraps `mermaid.render` in try/catch and returns `{ error }` with the
    message on failure.

### 2. Protect mermaid source from `rehype-highlight` — custom rehype plugin

`rehype-highlight` runs over *every* code block, which would wrap mermaid source
in highlight `<span>`s and corrupt it before mermaid can parse it.

Add a tiny local rehype plugin, inserted **between `remarkRehype` and
`rehypeHighlight`**, that walks the HAST tree and for each
`<pre><code class="language-mermaid">`:

- lifts the raw text content into a `<div data-mermaid-src="…">` placeholder
- replaces the `<pre>` node with that `<div>`

so `rehype-highlight` never sees the mermaid node, and the source survives
verbatim for the render step.

### 3. Render after HTML mounts — in `MarkdownPreview`

After the existing `dangerouslySetInnerHTML`, a `useEffect` (keyed on the
rendered HTML and the current theme) queries `[data-mermaid-src]` placeholders
and renders each diagram via the helper, writing the SVG (or an error box) into
the placeholder.

Guards:

- **Cancellation flag:** a `let cancelled = false` captured in the effect, set
  true on cleanup, so a stale debounced render cannot overwrite a newer one.
- **Theme re-render:** the effect depends on the resolved theme from
  `next-themes`, so toggling light/dark re-renders all diagrams.
- **Per-source SVG cache:** a module-level `Map` keyed by `${theme}:${source}`
  avoids re-rendering unchanged diagrams on every keystroke-debounce.
- **Unique ids:** each render gets a unique, DOM-valid id (incrementing
  counter) since mermaid requires it.
- **Inline error UI:** on parse failure, the placeholder shows a small error box
  containing the mermaid message and the raw source, rather than a broken or
  empty render.

### 4. Print / PDF

Ensure the rendered `svg` has `max-width: 100%` (via the `.md-preview` styles)
so wide diagrams aren't clipped when printed. No other export changes needed —
SVGs print as part of the existing `window.print()` flow.

## Components / files touched

| File | Change |
| --- | --- |
| `package.json` | add `mermaid` dependency |
| `src/lib/mermaid.ts` | **new** — lazy loader, init, `renderMermaid` helper, cache |
| `src/features/markdown/.../rehype-mermaid.ts` (or inline) | **new** — rehype plugin lifting mermaid fences to placeholders |
| `src/features/markdown/components/markdown-preview.tsx` | insert plugin into pipeline; add post-mount render effect + error UI |
| `src/app/globals.css` (or scoped styles) | `.md-preview svg`/mermaid block sizing for screen + print |

## Error handling

- **Invalid diagram syntax:** caught in `renderMermaid`, surfaced as an inline
  error box (message + raw source). Does not break the rest of the preview.
- **mermaid import failure:** caught; the affected placeholder shows an error;
  the rest of the markdown still renders.
- **Race conditions:** handled by the per-effect cancellation flag.

## Testing

- Manual: flowchart, sequence, gantt, and a deliberately broken diagram in
  editor/split/preview modes; verify each renders / errors correctly.
- Theme toggle re-renders diagrams in the matching theme.
- Rapid editing doesn't leave a stale diagram (cancellation works).
- PDF export (`⌘⇧E`) includes the rendered diagram, not clipped.
- A document with no mermaid blocks does not load the mermaid bundle.

## Non-goals

- Rich-text editor support (dropped).
- Authoring affordances beyond the existing textarea.
- Exporting individual diagrams as standalone image files.
- Pan/zoom controls for large diagrams.
