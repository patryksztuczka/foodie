# Foodie Server — Node/Express Practices

These guidelines apply to the server at `apps/server`.

## Runtime and modules

- Use ESM and modern ES2022 features. Prefer import/export consistently.
- Centralize environment access in `src/config/env.ts`. Do not read `process.env` elsewhere.
- Avoid top-level I/O side effects. Wire apps in `src/index.ts` only.

## Async, timeouts, and cancellation

- All I/O must have a timeout. Prefer `AbortSignal.timeout(ms)` or an `AbortController` passed through.
- Parallelize independent work with `Promise.all`, never await sequentially in loops.
- Propagate `AbortSignal` where possible.

## Logging

- Use the central logger only. No `console.log` outside very early boot or final fatal exits.
- Log structured objects with stable keys. Include message, category, and minimal context.

## Running scripts

- Install deps at repo root: `pnpm install`
- Dev server: `pnpm --filter foodie-server dev`
  - Loads env from `.env`, runs `src/index.ts` with Node 22 `--watch` and `--experimental-strip-types`.
