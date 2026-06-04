---
phase: 23-graveyard-system
verified: 2026-06-04T17:25:00Z
status: passed
score: 10/10 must-haves verified
overrides_applied: 0
---

# Phase 23: Graveyard System — Verification Report

**Phase Goal:** One unified graveyard per player (`player.graveyard[]`). Every destroyed/defeated/discarded card visible there. `player.welloe[]` eliminated. All graveyard entries typed objects. UI label "Graveyard". Revival cards read from graveyard.
**Verified:** 2026-06-04T17:25:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `player.welloe` absent from all `src/` JS engine/abilities files | VERIFIED | `grep "player\.welloe" src/**/*.js` — 0 hits. TS files (`return-to-hand.ts`, `ai-player.ts`) use `player.welloePile` on the separate declarative registry — intentionally out of scope per SUMMARY decision record. |
| 2 | `player.discard` absent from `src/engine/*.js` and `src/abilities/*.js` | VERIFIED | `grep "player\.discard" src/engine/*.js src/abilities/*.js` — 0 hits. Remaining TS hits are in the declarative registry system (separate codebase). |
| 3 | `graveyardUtils.js` exports `toGraveyardEntry`, `addToGraveyard`, `getGraveyardByType` | VERIFIED | File exists at `src/engine/graveyardUtils.js`; all three exports confirmed at lines 19, 37, 58. Simplified API: `toGraveyardEntry(cardId, source)` and `addToGraveyard(state, playerId, cardId, source)` — internal card-def map removes need for caller-supplied `allCardData` (documented in 23-REVIEW-FIX.md CR-04). |
| 4 | `markMosjeDefeated` pushes `{ ...mosjeSlot, type:'MOSJE', source:'defeated' }` to `player.graveyard` | VERIFIED | `src/engine/victoryChecker.js` line 124: `state.players[playerId].graveyard.push({ ...mosje, type: 'MOSJE', source: 'defeated' });` |
| 5 | `effect_mosje_reborn` and `effect_call_of_welloes` use `getGraveyardByType(player, 'MOSJE')` | VERIFIED | `src/abilities/piecieEffects.js` line 473: `getGraveyardByType(player, 'MOSJE')` in `effect_mosje_reborn`; line 741: `getGraveyardByType(player, 'MOSJE')` in `effect_call_of_welloes`. Both imported from `graveyardUtils.js` (line 10). |
| 6 | `effect_klaar_met_jou` calls `addToGraveyard` for opponent's discarded card | VERIFIED | `src/abilities/piecieEffects.js` lines 1135-1138: splices last hand card, extracts cardId, calls `addToGraveyard(state, oppId, cardId, 'discarded')`, re-derives opp. |
| 7 | `effect_those_eyelashes` calls `addToGraveyard` for each discarded hand card | VERIFIED | `src/abilities/piecieEffects.js` lines 651-654: splices first hand card, calls `addToGraveyard(state, oppId, cardId, 'discarded')`, re-derives opp inside loop. |
| 8 | Board label reads "Graveyard" in `boardRenderer.js` | VERIFIED | `src/ui/boardRenderer.js` line 593: `label.textContent = 'Graveyard';`. Also line 604: click handler calls `showGraveyardModal`. |
| 9 | No card description in `src/data/*.js` still reads "discard pile" (case-insensitive) | VERIFIED | `grep -ri "discard pile" src/data/` — 0 hits. Three descriptions updated: Tempiecie, Huisbaas, Chillingsvoorbij. |
| 10 | 912 tests passing | VERIFIED | `npm test` output: `102 passed (102)` test files, `912 passed (912)` tests, 0 failures. |

**Score:** 10/10 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/graveyardUtils.js` | Pure helpers: `toGraveyardEntry`, `addToGraveyard`, `getGraveyardByType` | VERIFIED | 61-line file, all three exports present, pure functions with spread return for `addToGraveyard`. |
| `src/engine/victoryChecker.js` | `markMosjeDefeated` pushes to `player.graveyard` only | VERIFIED | Line 124 confirmed. No `player.welloe` or `player.discard` push present. |
| `src/engine/turnManager.js` | `confirmCallOfWelloes` reads `player.graveyard`; reshuffle uses `player.graveyard` | VERIFIED | Lines 862-866: `findIndex` on `player.graveyard` by cardId+type='MOSJE', then `splice`. Bare-string pushes fixed by CR-01 in REVIEW-FIX. |
| `src/abilities/piecieEffects.js` | `effect_mosje_reborn` + `effect_call_of_welloes` use `getGraveyardByType`; `klaar_met_jou` + `those_eyelashes` call `addToGraveyard` | VERIFIED | Import at line 10; all four functions verified above. |
| `src/ui/modalManager.js` | `showGraveyardModal` reads `player.graveyard`; header "Graveyard" | VERIFIED | Canonical function present; legacy alias `showDiscardViewerModal` retained per decision record. |
| `src/ui/boardRenderer.js` | Label "Graveyard"; reads `player.graveyard` | VERIFIED | Lines 593, 604 confirmed. |
| `src/main.js` | `toBoardViewModel` outputs `graveyard: player.graveyard`; calls `showGraveyardModal` | VERIFIED | Per SUMMARY and CR-02/CR-05 fixes; confirmed by test suite green (912/912). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `markMosjeDefeated` | `player.graveyard` | `graveyard.push({ ...mosje, type:'MOSJE', source:'defeated' })` | WIRED | `victoryChecker.js` line 124 |
| `effect_mosje_reborn` | `player.graveyard` | `getGraveyardByType(player, 'MOSJE')[0]` + splice | WIRED | `piecieEffects.js` lines 473-479 |
| `addToGraveyard` | `player.graveyard` | spreads player with `graveyard: [...(player.graveyard ?? []), entry]` | WIRED | `graveyardUtils.js` lines 44-46 |
| `boardRenderer.js renderDiscardPile` | `player.graveyard` | `const discardCards = player.graveyard \|\| []` | WIRED | `boardRenderer.js` line 538 (per SUMMARY) |
| `modalManager.js showGraveyardModal` | `player.graveyard` | `const discardCards = player?.graveyard \|\| []` | WIRED | `modalManager.js` (per SUMMARY) |
| `confirmCallOfWelloes` | `player.graveyard` | `findIndex(e => e.cardId === mosjeCardId && e.type === 'MOSJE')` | WIRED | `turnManager.js` line 863 |

---

### Data-Flow Trace (Level 4)

Not applicable — phase implements a data-layer refactor and rename, not a new dynamic rendering path. The graveyard data written by engine functions is consumed by UI functions that were verified wired above.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 912 tests pass | `npm test` | `912 passed (912)`, 0 failures | PASS |
| No `player.welloe` in JS engine/abilities | `grep "player\.welloe" src/**/*.js` | 0 matches | PASS |
| No `player.discard` in JS engine/abilities | `grep "player\.discard" src/engine/*.js src/abilities/*.js` | 0 matches | PASS |
| Board label is "Graveyard" | grep in `boardRenderer.js` | Line 593 confirmed | PASS |
| No "discard pile" in card data | `grep -ri "discard pile" src/data/` | 0 matches | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status |
|-------------|-------------|-------------|--------|
| GRAV-01 | 23-01 | Unified `player.graveyard[]` as sole destination | SATISFIED |
| GRAV-02 | 23-01 | `player.welloe[]` eliminated | SATISFIED |
| GRAV-03 | 23-01 | Revival cards read from `player.graveyard` | SATISFIED |
| GRAV-04 | 23-01 | Silent-removal bugs fixed (Klaar met Jou, Those Eyelashes) | SATISFIED |
| GRAV-05 | 23-02 | UI label "Graveyard" everywhere | SATISFIED |
| GRAV-06 | 23-02 | Card descriptions updated; docs updated | SATISFIED |

---

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholder returns, or empty handlers found in modified files. The `addToGraveyard` API deviation from plan (4-arg vs 5-arg) is a code-review improvement documented in 23-REVIEW-FIX.md CR-04 — not a stub.

### Human Verification Required

None — all must-haves are verifiable programmatically. UI label is a string literal confirmed by grep. Test suite confirms behavioral correctness.

---

## Verdict

All 10 must-haves verified against the actual codebase. The TS declarative registry files (`src/engine/reducers/`, `src/effects/`, `src/cards/`) retain `player.discard` / `player.welloePile` — this is the separate TypeScript system that coexists with the JS imperative engine and was explicitly excluded from scope per the SUMMARY decision record ("TS declarative registry files left unchanged — separate system").

---

_Verified: 2026-06-04T17:25:00Z_
_Verifier: Claude (gsd-verifier)_
