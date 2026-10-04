# Arena-style card UI (branch `ui/arena-hover-spotlight`)

MTG-Arena-style card handling, built as an additive prototype on the unified card template.
Desktop only (`@media (hover: hover)`); touch / the planned mobile drawer are untouched.

## What it does
| Feature | Where | Notes |
|---|---|---|
| Hand sits low, hover lifts + enlarges (1.28x) | `styles/arena.css` (`--hand-sink`, `.hand-card-wrap:hover`) | 0.14s transition. Play button only visible on hover. |
| Art-first field cards, smaller | `styles/arena.css` | Player Mosje 170px, opponent 130px. `.uc-text` / `.uc-meta` hidden on field. |
| Hover popup on any face-up field card (own + opponent) | `src/ui/hoverZoom.js` | Rebuilds the card from `getCardById` + live MP/level; skips `.face-down-piecie`. Init in `main.js`. |
| Spotlight: played/activated card shown big on the right, effects on the card, then flies back | `src/ui/cardSpotlight.js` | `showCardSpotlight`, `addSpotlightEffects`, `isSpotlightActive`. |
| Effect detection from state diff | `src/ui/actionAnimations.js` (`collectEffects`, `spotlightDelta`, `FLAG_ROWS`) | See table below. |

## Effects the spotlight shows
- Damage `⚔ −N MP` (red flash/shake) / Heal `♥ +N MP` (green flash) — any on-field MP change.
- Shield (blue): `immuneThisTurn`, `entryProtected`, Coert's Caravan block, Snelle flags
  (`negateNextPiecie/Attack/Search/Elimination`, `drainReversal`, `mpLossReduction`), plus "Negated!" when a shield flag is consumed.
- Info (yellow): `forceReroll`, `questDiceBonus`, `doubleNextPiecie`, `copyLastPiecie`, `counterChain`, card draw, return-from-graveyard, Lucky Coin heads/tails (passed via `options.extraEffects` from `main.js`).

## Triggers
- Human field play / ability: `animateFieldActivation` opens it, `animateStateDelta` adds effect rows.
- Snelle instant: `renderAndAnimate(..., { actionLabel: 'play-snelle', placedCardId })` (no field slot → fades).
- Bot steps: `playBotSteps` calls `animateStateDelta(..., { isBotStep: true })`; loop waits ~1.5s while a spotlight is up.
- Human Snelle interrupt during the bot's turn (`showDamageInterruptModal`).

## Tests
- `tests/ui/cinema/arena-hover.spec.js` — hand hover, field popup, spotlight, shield/heal, Snelle (screenshots `tests/ui/screenshots/arena-*.png`).
- `tests/ui/cinema/arena-bot-spotlight.spec.js` — a real bot Mosje play opens a spotlight.
- `playCardFromHand` (helpers), `smoke.spec.js`, `full-game.spec.js` now hover before clicking Play (hand is sunk).

## Known gaps / for after the card redesign
- Shield/heal only where the state diff shows them; effects that change nothing observable (e.g. Jammertje's "reveal 1 card") show the card but no row.
- Heal = any MP gain on a field Mosje (quest rewards / passives also read as "♥").
- Field names can clip under the MP badge at 130px — revisit with the new card layout.
- Spotlight/popup size constants (300/320px, `--hand-sink`) assume the current unified template; re-tune after the redesign. They render via `renderCard`, so they follow the new design automatically.
- Pre-existing failing UI tests, not caused by this work: `mechanics.spec.js` VIS-02 (stale `.mosje-mp-header` selector), VIS-03/04/09 (first-turn quest lock), smoke "two full turns".
- `try-arena.html` (repo root, untracked) is a local helper that seeds an offline session and redirects to the game; delete when done.
