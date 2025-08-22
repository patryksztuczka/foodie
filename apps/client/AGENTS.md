# Foodie Client — React/Vite Practices

These guidelines apply to the client at `apps/client`.

## Components and structure

- Prefer functional components with explicit props types.
- Keep components small and focused; extract pure utilities out of React.

## State and data flow

- Lift state only when needed; prefer local state for local concerns.
- Derive state, avoid duplication; memoize with `useMemo`/`useCallback` only for measured needs.

## Styling

- Use Tailwind for styling; prefer composable utility classes over custom CSS.
- Keep global styles minimal in `src/globals.css`.

## Data fetching and validation

- Type APIs end-to-end. Validate external data with Zod at boundaries when practical.
- Isolate fetch logic in small hooks or modules; keep components declarative.

## Performance

- Avoid unnecessary re-renders via proper keying and prop stability.
- Code-split routes or heavy components when they become a bottleneck.

## Running scripts

- Install deps at repo root: `pnpm install`
- Dev: `pnpm --filter foodie dev`
- Build: `pnpm --filter foodie build`
- Preview: `pnpm --filter foodie preview`
- Lint: `pnpm --filter foodie lint`
