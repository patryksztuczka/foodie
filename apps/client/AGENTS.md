# Foodie Client — React/Vite Practices

These guidelines apply to the client at `apps/client`.

## Folder structure

All names are kebab-case. Keep UI declarative and push side effects to hooks or data-access modules.

- `src/components/`: Presentational and container components. No direct fetch calls; import hooks or data-access functions. Keep props explicit and typed.
- `src/hooks/`: Reusable hooks for local concerns (e.g., debouncing, event listeners). No cross-cutting app state here.
- `src/data-access-layer/`: Thin modules that call server endpoints, validate with Zod, and return typed results. No UI logic.
- `src/`: App bootstrap (`app.tsx`, React Query provider), entry (`main.tsx`), global styles.

## Components and structure

- Clarity and Reuse: Every component and page should be modular and reusable. Avoid duplication by factoring repeated UI patterns into components.
- Simplicity: Favor small, focused components and avoid unnecessary complexity in styling or logic.
- Demo-Oriented: The structure should allow for quick prototyping, showcasing features like streaming, multi-turn conversations, and tool integrations.

### Example component definition

```
type HeaderProps = {
  readonly title: string;
};

export const Header = ({ title }: HeaderProps) => {
  return (
    <h1>{title}</h1>
  );
};
```

## State and data flow

- Lift state only when needed; prefer local state for local concerns.

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
