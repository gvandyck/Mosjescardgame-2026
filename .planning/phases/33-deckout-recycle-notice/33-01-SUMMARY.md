---
phase: 33-deckout-recycle-notice
plan: 01
type: execute
status: complete
files_modified:
  - src/engine/turnManager.js
  - src/ui/actionAnimations.js
  - src/main.js
  - styles/board.css
files_created:
  - tests/deckout-event-marker.test.ts
  - tests/ui/deckout-banner.spec.js
---

# Summary — Deck-out "Deck Recycled" visual notice

## What was built
When a player's draw deck empties, the D-06 rule already recycles their discard into a
fresh deck, draws 1, and skips their next turn — but silently. This phase adds a visible,
~3-second notice shown to BOTH players, plus a battle-log record and a board cue. Pure
visibility layer: no engine MP / quest / level / turn-order logic changed.

## Changes
- **Engine (src/engine/turnManager.js):** `phaseDrawCard` now stamps a one-shot
  `state._deckOutEvent = { playerId, turnNumber, reshuffledCount }` in the deck-out
  branch, right after `skipNextTurn = true`. Not cleared in the engine, so it rides the
  existing `gameState` sync to the opponent. Stale "no penalty — may change later" comment
  corrected to describe the real reshuffle+skip behavior.
- **UI (src/ui/actionAnimations.js):** new `createCenterBanner()` primitive (owns the
  append + animationend teardown) reused by a new `showDeckOutBanner()`; new
  `pulseDiscardPile(deckOutPlayerId, localPlayerId)` flashes `#discard-player` /
  `#discard-opponent`. Player name HTML-escaped via a local `escapeText`. `showTurnTransition`
  left untouched.
- **Wiring (src/main.js):** `maybeAnnounceDeckOut(state)` called inside `renderFromState`
  (the single choke point hit by both local actions and `onRemoteState`), de-duped by
  `${playerId}#${turnNumber}` via module-scope `_lastDeckOutShownId`. Emits a `log.add`
  line + banner + pile pulse exactly once per event per client. Modeled on the existing
  `_lastPlaceEffect` → `showPlaceEffectBanner` pattern.
- **CSS (styles/board.css):** `.deckout-banner` (cyan center banner, ~3s `deckout-banner-in`
  keyframe), `.discard-pile--recycling` pulse, and a dedicated reduced-motion override
  (`deckout-banner-fade`) so the banner still shows (essential info) — deliberately kept
  OUT of the existing `animation: none` group so `animationend` still fires and the banner
  self-removes.

## Verification (all green)
- `node --check` on all UI + engine files — clean.
- `npm test` — 433 passed (40 files), incl. new `deckout-event-marker.test.ts` (3 tests:
  marker stamped, skip penalty preserved, no marker when deck+discard both empty).
- Visual tester `tests/ui/deckout-banner.spec.js` (Playwright, visual project) — passes:
  banner text ("DECK RECYCLED" / reshuffled / skips next turn), battle-log line, discard
  pulse, auto-dismiss; screenshot `tests/ui/screenshots/deckout-recycle-banner.png`.
- **Fail-first proven:** with the 4 source files stashed, the visual spec fails (no
  `.deckout-banner`); restored → passes.
- Regression guard `tests/ui/deckout-hang-repro.spec.js` — still passes (skip-turn recovery
  intact).

## Notes / follow-ups
- Multiplayer path verified by construction (marker on synced `gameState`, announced in
  `onRemoteState → renderFromState`); a live 2-client check is in the human checkpoint.
- `showTurnTransition` could later adopt `createCenterBanner` to fully de-duplicate the
  banner lifecycle — left out here to avoid touching working code.
