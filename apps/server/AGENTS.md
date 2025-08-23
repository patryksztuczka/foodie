# Foodie Server — Node/Express Practices

These guidelines apply to the server at `apps/server`.

## Folder structure

All names are kebab-case. Public HTTP surface is versioned and mounted under `/api/v1`.

- `src/controllers/`: Request handlers. Validate inputs (query/body/params) at the boundary, delegate to services, never call external APIs directly. No business logic.
- `src/services/`: Side-effect adapters to external systems (e.g., Open Food Facts, databases). Enforce timeouts and map external data to internal shapes. Validate outbound responses with Zod before returning.
- `src/schemas/`: Zod schemas and TypeScript types for server-owned payloads (requests/responses/domain). No runtime side effects.
- `src/routes/`: Express routers grouped by version and feature. Only wires HTTP verbs to controllers and applies middleware.
- `src/config/`: Environment and configuration modules. Single read location for `process.env` and derived config.
- `src/types/`: Type-only declarations needed across modules. No runtime code.
- `src/`: App bootstrap (Express app creation, CORS, route mounting). No business logic.

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
