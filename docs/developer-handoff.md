# Developer Handoff

## ⚠️ Single source of truth: the imperative `.js` engine
This project has **one** engine — the imperative JavaScript engine that runs the
live browser game, the bot, multiplayer, and the Playwright/cinema tests. The old
**declarative TypeScript engine** (card registry + effect primitives) has been
**retired to `/_archive/`** (2026-06-12). Do **not** read, scan, or edit `/_archive/`,
and never create a second `.ts` definition of a card — edit each card once, in `.js`.
See CLAUDE.md → "Architecture: ONE engine".

> Because the live game serves raw `.js` to the browser (no build step), a `.js`
> file can never import a `.ts` file. Everything that runs the game is `.js`.

## Project State
- Feature-complete engine: all cards, bot opponent, graveyard system, interrupt
  modal, MP 0–100 invariant, defeat-at-0.
- Tests: ~412 vitest unit tests (exercise the `.js` engine) + a Playwright
  browser suite that boots the real game and asserts on-screen results.
- Active focus: clean prototype for physical-print playtesting — card editing,
  multiplayer (P2P + bot), and real-behavior testing.

## Architecture Overview

### Runtime layers (all `.js`)
1. **Card data** — pure data definitions, no logic: `src/data/*.js`
   (`mosjes.js`, `piecies.js`, `snellePiecies.js`, `places.js`, `quests.js`).
2. **Effects / abilities** — the behaviour of each card: `src/abilities/*.js`
   (`mosjeAbilities.js`, `piecieEffects.js`, `snelleEffects.js`, `placeEffects.js`,
   `questLogic.js`).
3. **Game engine** — turn flow, MP, victory: `src/engine/*.js`
   (`turnManager.js`, `mpManager.js`, `victoryChecker.js`, `gameState.js`,
   `deckEngine.js`, `synergyResolver.js`, `graveyardUtils.js`).
   - Turn-start trickle: every active Mosje of the active player gains +10 MP at
     the start of each turn (in `startTurn()` before Place effects and the Draw Phase).
   - Central invariant sweep in `victoryChecker.checkVictory`: `applyPendingDefeats`
     (defeat below 0 MP) then `clampMosjeMp` (cap at 100). Only Quests permanently level.
4. **UI** — `src/ui/*.js` (`boardRenderer`, `handRenderer`, `modalManager`,
   `logRenderer`, `actionAnimations`) + `src/main.js` (bootstrap, test hooks).
5. **Bot / multiplayer** — `src/bot/`, `src/multiplayer/`.

### File map
- **Card data (edit cards here):** `src/data/`
- **Card behaviour:** `src/abilities/`
- **Engine:** `src/engine/`
- **UI:** `src/ui/`, `src/main.js`
- **Bot / multiplayer:** `src/bot/`, `src/multiplayer/`
- **Rules:** `src/rules/`
- **Archived (do not touch):** `_archive/`

## Implementation guides

### Adding or changing a card
1. Edit the data entry in `src/data/<type>.js` (name, cost, traits, description) —
   **data only, no logic**.
2. Implement/adjust its effect in the matching `src/abilities/*.js`.
3. Update docs: `docs/card-reference.md` (verify against code, not stale flags).
4. Add a test — preferably a real-engine browser test in `tests/ui/cards/`
   (card-test-library) so it asserts actual in-game behaviour. If it touches
   MP/quests/levels, also re-run the Ronald Kip stacking test + simulation.
5. Do **not** create a `.ts` definition. One source of truth.

## Testing
- **Unit (vitest):** `npm test` — `tests/**/*.ts` that import and exercise the `.js`
  engine (`tests/abilities/`, `tests/engine/`, `tests/bot/`, …).
- **Real-engine browser (Playwright):** boots the actual game and asserts on-screen
  MP/results — the antidote to hallucinated tests:
  - `npm run test:cards` — data-driven card-effect library (`tests/ui/cards/`)
  - `npm run test:cinema` — narrated headed demos (`tests/ui/cinema/`)
  - `npm run test:ui` — smoke + mechanics; `npm run test:sim` — bot-vs-bot simulation
- Always syntax-check UI files (`node --check src/main.js src/ui/*.js`) — vitest does
  not import them, so a parse error there only shows at runtime in the browser.

## Graveyard System (Phase 23)

### player.graveyard[]
All defeated, destroyed, and discarded cards go into a unified `player.graveyard[]`.
The legacy fields `player.discard` and `player.welloe` were removed from all engine
and abilities code.

Entry format: `{ cardId, name, type: 'MOSJE'|'PIECIE'|'SNELLE'|'PLACE'|'UNKNOWN', source: 'defeated'|'discarded'|'destroyed' }`

### graveyardUtils.js (`src/engine/graveyardUtils.js`)
- `toGraveyardEntry(cardId, allCardData, source)` — builds a typed entry.
- `addToGraveyard(state, playerId, cardId, allCardData, source)` — returns new state (no mutation).
- `getGraveyardByType(player, type)` — filters entries by type.

### UI
- Viewer modal: `showGraveyardModal` in `src/ui/modalManager.js`.
- Board label "Graveyard" in `src/ui/boardRenderer.js`; `toBoardViewModel` in
  `src/main.js` outputs `graveyard: player.graveyard`.

## Environment Setup
- Node.js (Node 20+), npm. `npm install`.
- `npm test` — unit tests. `npm run test:cards` / `test:cinema` / `test:ui` — browser.
- `npm run serve` — local server on port 5500 to play the game manually.

## Documentation index
- `docs/card-reference.md` — what each card does (verify against code)
- `docs/phase0-rulings.md` — canonical game rules
- `docs/playtesting-guide.md`
- `docs/simulation-report.md` — latest bot-vs-bot results
