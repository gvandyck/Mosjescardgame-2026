# Validation Baseline

This repo now has a practical validation command for agent and human work:

```bash
npm run validate
```

It runs:

1. `npm run lint`
2. `npm run typecheck:source`
3. `npm test`

## Current Gates

### Lint

`npm run lint` uses ESLint v9 flat config from `eslint.config.js`.

The current baseline exits with warnings for existing `any` usage. Treat new `any` usage as something to avoid unless it is clearly needed for a boundary or legacy fixture.

### Source Typecheck

`npm run typecheck:source` uses `tsconfig.source.json`.

This checks production TypeScript under `src/**/*.ts` without including the older test fixtures that still need typing cleanup.

### Tests

`npm test` remains the strongest behavior gate. It currently covers the engine, effects, registry, simulations, and selected UI rules.

## Known Remaining Gap

Full `npx tsc --noEmit` is still not a clean gate because tests and legacy fixtures have many type-shape mismatches:

- plain string test IDs versus branded `CardId`
- partial `GameState` fixtures missing newer fields
- intentionally loose JS interop tests
- old `@ts-expect-error` comments that are no longer active after relaxed source typing

Do not use full `tsc --noEmit` as the default completion gate until those fixtures are cleaned up.
