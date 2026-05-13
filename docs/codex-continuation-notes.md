# Codex Continuation Notes

This note records the practical handoff state for continuing work safely with Codex.

## Handled On This Branch

- Added repo-root `AGENTS.md` for Codex/agent safety rules.
- Added ESLint v9 flat config in `eslint.config.js`.
- Added `npm run typecheck:source` using `tsconfig.source.json`.
- Added `npm run validate` as the preferred local gate.
- Documented the validation baseline in `docs/validation-baseline.md`.
- Documented the two card data surfaces in `docs/card-data-surfaces.md`.
- Broadened a few TypeScript schema types to match card definitions already present in the repo.

## Preferred Completion Gate

Run:

```bash
npm run validate
```

Current result:

- lint: passes with existing warnings
- source typecheck: passes
- tests: 79 files, 583 tests passing

## Known Open Caveats

### Full TypeScript Strictness

`npx tsc --noEmit` is still not a clean gate because it includes older test fixtures with many shape mismatches. Use `npm run typecheck:source` until test fixtures are cleaned up.

### Lint Warnings

`npm run lint` still reports existing `any` usage as warnings. New code should avoid adding more.

### Card Data Duplication

The browser UI still uses `src/data/*.js`, while the tested TypeScript engine uses `src/cards/**/*.ts`. See `docs/card-data-surfaces.md`.

### Deferred Mechanics

Many advanced cards intentionally have partial/deferred behavior. Use:

- `docs/card-reference.md`
- `docs/phase0-rulings.md`
- `docs/developer-handoff.md`
- phase question docs under `docs/phase*-questions.md`

Do not “complete” a deferred mechanic by guessing. Match the ruling docs or document the ambiguity first.

### UI And Multiplayer

The browser UI and Firebase multiplayer layer are still the main in-progress product surface. Engine tests do not guarantee browser flow correctness.
