# Card Data Surfaces

The repo currently has two card data surfaces. This is intentional for now, but it is easy to forget.

## Browser/UI Data

Files:

- `src/data/mosjes.js`
- `src/data/piecies.js`
- `src/data/snellePiecies.js`
- `src/data/places.js`
- `src/data/quests.js`
- `src/data/cardIndex.js`

Used by:

- `src/main.js`
- `src/ui/*`
- browser pages such as `game.html`, `deck-builder.html`, and demos
- Firebase/browser game state

This layer controls what the current plain JavaScript UI displays and plays.

## TypeScript Engine Registry

Files:

- `src/cards/**/*.ts`
- `src/cards/registry/*`
- `src/cards/executor/*`
- `src/effects/**/*`
- `src/engine/**/*`

Used by:

- Vitest engine/effect/card tests
- simulation harness
- typed card executor and primitives

This layer controls the tested declarative card runtime.

## Working Rule

When adding or changing a card, ask which surface is affected:

- UI-only text/art/display change: update `src/data/*.js` and relevant UI.
- Engine behavior change: update `src/cards/**/*.ts`, effects/engine code, and tests.
- Player-visible gameplay change in the browser: update both surfaces or deliberately document why only one changes.

If a card ID, name, cost, type, or effect summary changes in one surface, check the other surface before finishing.

## Long-Term Direction

The cleaner end state is one canonical card source feeding both UI and engine. Until that exists, this document is the guardrail.
