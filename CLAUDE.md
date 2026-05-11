# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UseTiny is a collection of lightweight productivity tools built with Next.js 16 and React 19. The project uses the App Router architecture and focuses on client-side interactivity with persistent state management.

## Development Commands

```bash
# Package manager: pnpm (do not use npm or yarn)
pnpm install              # Install dependencies
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build                # Production build
pnpm start                # Run production build
pnpm lint                 # Run ESLint
pnpm audit                # Security audit
```

## Architecture

### Directory Structure

```
src/
├── app/                  # Next.js 16 App Router pages
│   ├── layout.tsx       # Root layout with ThemeProvider, TooltipProvider, Toaster
│   ├── page.tsx         # Homepage
│   └── notepad/         # Tool-specific routes
├── features/            # Feature-based modules (stores + components)
│   └── notepad/
│       ├── store.ts     # Zustand store with persist middleware
│       └── components/  # Feature-specific components
├── components/          # Shared components
│   └── ui/             # shadcn/ui components (DO NOT edit manually)
├── hooks/              # Custom React hooks
└── lib/                # Utilities (utils.ts for cn() helper)
```

### Key Architectural Patterns

**Feature-Based Organization**: Each tool (e.g., notepad) is organized in `src/features/[tool]/` with:

- `store.ts`: Zustand store with persistence
- `components/`: Feature-specific components

**State Management with Zustand**:

- Uses Zustand with `persist` middleware for localStorage persistence
- `skipHydration: true` requires manual hydration via `useStoreHydration` hook
- Stores use versioning (`version: 1`) for migration support
- Example pattern in `src/features/notepad/store.ts:39-129`

**Hydration Pattern**:

- Client-side stores must use `useStoreHydration` hook (see `src/hooks/use-store-hydration.tsx`)
- This prevents hydration mismatches between server and client
- Pattern: Show loading state until `hydrated === true`

**PostHog Analytics**:

- Initialized in `instrumentation-client.ts` (production only)
- Uses proxy rewrites in `next.config.ts` (`/relay-aqZo/*` → PostHog)
- Requires `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env`

### Tech Stack Details

**UI Framework**:

- shadcn/ui (new-york style) with Radix UI primitives
- Components in `src/components/ui/` are generated - use `npx shadcn@latest add [component]`
- Theme system via `next-themes` with system preference support
- Lucide React for icons

**Styling**:

- Tailwind CSS 4 with CSS variables for theming
- Global styles in `src/app/globals.css`
- Utility function `cn()` in `src/lib/utils.ts` for class merging

**Data Persistence**:

- Zustand stores with `persist` middleware use localStorage
- Tab limit enforced (50 tabs max in notepad to prevent localStorage exhaustion)

## Path Aliases

Use these import aliases (configured in `tsconfig.json` and `components.json`):

```typescript
@/components    // src/components
@/lib           // src/lib
@/hooks         // src/hooks
@/features      // src/features
```

## Important Constraints

1. **shadcn/ui components**: Never manually edit files in `src/components/ui/`. Use the CLI to add/update components.

2. **Zustand hydration**: All persisted Zustand stores must:
   - Use `skipHydration: true` in persist config
   - Be manually hydrated with `useStoreHydration` hook
   - Show loading state until hydration completes

3. **Package manager**: Always use `pnpm`, never npm or yarn.

4. **PostHog environment**: Analytics only initialize in production (`NODE_ENV === "production"`).

5. **React/Next.js versions**: Uses Next.js 16 with React 19 - be aware of API changes from previous versions.

## SEO

**Domain**: `https://usetiny.app`

### Conventions

- **`robots.ts`** and **`sitemap.ts`** live in `src/app/`. Update `sitemap.ts` when adding new routes.
- **Root metadata** in `layout.tsx` sets `metadataBase`, OpenGraph, Twitter cards, and a global description. Each page overrides `title`, `description`, `keywords`, `alternates.canonical`, and adds page-specific OpenGraph/Twitter if needed.
- **Titles**: Keep simple (e.g., "Notepad", "QR Generator"). The template `"%s | UseTiny"` appends the brand automatically.
- **Descriptions**: Keyword-rich, 140-155 characters, include a call to action or differentiator (e.g., "No sign-up", "runs locally").
- **Canonical URLs**: Every page must set `alternates: { canonical: "/path" }`.
- **JSON-LD structured data**: Each tool page includes a `<script type="application/ld+json">` with `WebApplication` schema (`applicationCategory: "UtilityApplication"`, `offers.price: "0"`). The homepage uses `WebSite` schema.
- **Server components for SEO**: The homepage (`page.tsx`) is a server component so that all tool listings, descriptions, and links are in the initial HTML. Client interactivity (command palette) is extracted to a separate `"use client"` component.

### OpenGraph Images

Each route has an `opengraph-image.tsx` that generates a 1200×630 PNG via Next.js `ImageResponse` (Satori renderer). Preview by visiting `/<route>/opengraph-image` in the browser.

**Shared helper**: every OG route uses `renderOgImage()` from `src/app/_og/frame.tsx`. The helper renders the outer frame (padding, background, font family), the tagline, and the `usetiny.app` brand mark, and loads the fonts. Each route file passes `tagline` and the variant-specific `children` (wordmark + visual element). Optional `taglineMarginTop` (default 44) overrides the gap between content and tagline. Also re-export `OG_SIZE as size` and `OG_CONTENT_TYPE as contentType` from each route (Next.js reads these as named exports per the metadata file convention).

**Fonts**: real Geist TTFs live in `src/app/_og/fonts/` (downloaded from `vercel/geist-font`). The bundler traces them via `new URL("./fonts/...", import.meta.url)` in `_og/fonts.ts`, and the three loaders are memoized at module scope so each TTF is read at most once per process. Do NOT use edge runtime for OG images — Node runtime is required for `readFile`. Do NOT fetch fonts from CDNs at request time (WOFF2 isn't supported by Satori; CDN dependencies break builds).

**Design rules**:

- Dark background (`#0a0a0b`), no gradients, no eyebrows, no decorative chrome
- **Wordmark**: tool name in Geist Black (`fontWeight: 900`), ~180–224px depending on length. End the wordmark with a colored period (`.`) in the tool's accent color — this is the only required color accent
- **Inline visual element** (optional but encouraged): exactly ONE small, distinctive element that demonstrates the tool — e.g., a selection highlight + cursor (Rich Text), a QR finder pattern (QR), a formula chip `=SUM(...)` (Spreadsheet), a `# ` prefix (Markdown), an HTTP method pill (Webhook), a file-size delta `2.4 MB → 184 KB` (Image). Use the tool's accent color. Keep it small relative to the wordmark.
- **Tagline**: one punchy marketing line. Geist Medium 500, fontSize 44, color `#d4d4d8`. Use the opposition pattern (value + friction removed) — e.g. "All the formatting. None of the sign-up." Avoid feature lists.
- **Brand mark**: `usetiny.app` bottom-right in Geist Mono Medium 500, fontSize 36, color `#d4d4d8`. Must be clearly visible.
- **Long names** (≥ 9 chars per word): stack vertically with one word per line (e.g. `Word` / `Counter`); render second word in `#71717a` for hierarchy.
- Each image still has a **distinct composition** — the inline visual element should differ tool-to-tool.

**Tool accent colors**: Notepad `#f59e0b` · Rich Text `#a78bfa` · QR `#a855f7` · Spreadsheet `#10b981` · Markdown `#ec4899` · Image `#f97316` · Word Counter `#3b82f6` · YouTube Looper `#ef4444` · Webhook Inspector `#06b6d4` · PDF Editor `#f43f5e`.

**Satori constraints** — the renderer does NOT support:

- CSS Grid (flexbox only)
- `<br />` inside elements (causes "Expected div to have explicit display: flex" error — use single text strings instead)
- SVG filters, blur, backdrop-filter
- WOFF2 fonts ("Unsupported OpenType signature wOF2") — use TTF or WOFF only
- Custom web fonts without explicit font data loading via the `fonts` option

### New Tool Checklist

When adding a new tool, complete all of the following:

1. Add the route to `sitemap.ts`
2. Export `metadata` with `title`, `description`, `keywords`, and `alternates.canonical`
3. Add `WebApplication` JSON-LD with `price: "0"` and relevant `featureList`
4. Add the tool to `src/lib/tools.ts` with `addedAt: "YYYY-MM-DD"` (today). The homepage tool list and command palette pull from this array — no other registration needed.
5. Create `opengraph-image.tsx` in the route directory following the design rules above — use a composition that differs from existing tool images

## "N NEW" badge

The home page's **More tools** button shows an inverted-pill `N new` badge counting tools whose `addedAt` is newer than the user's last command-palette open. Mechanism lives in:

- `src/lib/tools.ts` — `Tool.addedAt` field; new tools added to this array automatically become "new" for every existing user.
- `src/lib/new-tools-ack.ts` — `getSeenAt()` reads, `markAllNewToolsSeen()` writes `Date.now()` to `localStorage["usetiny-new-tools-seen-at"]` and dispatches a synthetic `storage` event so same-tab subscribers update without a reload.
- `src/app/_components/command-palette.tsx` — calls `markAllNewToolsSeen()` in a `useEffect` watching `commandOpen`, so opening the palette clears every currently-new badge at once.
- `src/app/_components/tool-list.tsx` — subscribes via `useSyncExternalStore` and filters `allTools` by `Date.parse(t.addedAt) > seenAt && !shown.has(t.href)`.

Operational notes:

- To force-clear the badge globally, remove or bump the `usetiny-new-tools-seen-at` key; there's no server-side state.
- To change the dismissal trigger (e.g., dismiss on any tool visit instead of palette open), call `markAllNewToolsSeen()` from the new trigger and remove the palette call.
- The command palette also shows a subtle bottom gradient on its result list as a scroll/more-content affordance. Only rendered when `!noResults && filteredTools.length > 0`.
