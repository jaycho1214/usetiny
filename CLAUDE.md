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
