---
phase: 54-energy-levels-and-getemt
plan: 10
subsystem: engine
tags: [getemt, welloe-pile, mp-loss, obby-2.0]
requires: ["54-09"]
provides:
  - "applyGetemt + applyMpLossToSlot: the slot-level loss funnel (pipeline -> subtract -> track -> getemt)"
  - "player.welloePile fed by markMosjeDefeated; read by Mosje Reborn and Call of the Welloes"
key-files:
  created:
    - src/engine/mp/applyGetemt.js
    - src/engine/mp/applyMpLossToSlot.js
    - tests/engine/getemt.test.ts
  modified:
    - src/engine/mpManager.js
    - src/engine/victoryChecker.js
    - src/engine/turnManager.js
    - src/abilities/piecieEffects.js
    - src/main.js
requirements-completed: []
duration: 15min
completed: 2026-10-11
---

# Phase 54 Plan 10: Getemt and the Welloe pile Summary

loseMP now follows the 2.0 getemt rule through one slot-level funnel, and a Mosje that is getemt while sideways goes to its owner's separate Welloe pile.

## Commits
- a515de8: applyGetemt, applyMpLossToSlot, loseMP rewired, getemt.test.ts (red first: module missing), mp-level-regression.test.ts deleted.
- 7436408: Welloe pile sweep, Reborn / Call of the Welloes / KNOCKOUT text re-pointed, V4 defeat tests replaced.

## Behaviour
- Real loss (final > 0) leaving MP <= 0: L2-3 -> level -1, MP 50, new level traits; L1 upright -> MP 0, sideways; L1 sideways -> `_pendingWelloe`, swept by checkVictory into `welloePile` (`source: 'welloe'`). WELLOE_SHIELD and Not Today! still save (5 MP, stay on field). Loss reduced to 0 -> nothing happens.
- applyPendingDefeats still also handles legacy `_pendingDefeat` (the effect-file copies from 54-05 still set it until 54-13..15), so those paths now also end up in the Welloe pile.
- Decision 6: no Welloe pile UI before Phase 63; only a battle-log line `[ENGINE] <name> getemt while sideways -> Welloe pile`. This intentionally departs from the V4 "every defeated card shows in the discard pile" memory: the 2.0 Welloe pile is separate (handoff §2f).
- T-54-24: grep shows `welloePile` only in gameState (init), victoryChecker (push), piecieEffects and turnManager (Reborn/Call), main.js (KNOCKOUT text). deckEngine never reads it, so it is never shuffled back.

## Test changes (why each new value is correct under 2.0)
- Deleted tests/engine/mp-level-regression.test.ts: V4 `100 - overflow` carry is not a 2.0 rule; tracking cases ported to getemt.test.ts (14 cases).
- Deleted tests/engine/defeat-at-zero-mp.test.ts: V4 "defeat below 0 at Level 0, exactly-0 survives". Valid parts (WELLOE_SHIELD save, Not Today! save, KNOCKOUT on last Mosje, no-op sweep) are in getemt.test.ts; exactly-0 after a real loss now getemts (E4).
- unified-graveyard.test.ts: markMosjeDefeated asserts welloePile (source 'welloe'), graveyard empty.
- call-of-welloes-graveyard.test.ts, mosje-reborn-graveyard.test.ts: fixtures/expectations moved from graveyard to welloePile; "no entries" case now uses an empty pile.
- call-of-welloes.test.ts: cases A, B, F, G, H, I read/write welloePile (defeat of the anchored Mosje lands in welloePile).
- entry-protection.test.ts: "same loss applies once protection is gone": L1 at 0 MP losing 10 is now sideways (first getemt) instead of `_pendingDefeat`; the protected case also asserts not sideways.
- stub-engine-wiring.test.ts Test 9: unshielded defeat lands in welloePile, none in graveyard.

## Deviations
None. KNOWN GAP (unchanged, 54-13..15): effect-file `applyDamage` copies still use the interim `_pendingDefeat` path and bypass the pipeline.

## Tests
npm test: 99 files / 1014 tests green. node --check (CLAUDE.md list plus touched files) clean. Playwright and sim not run.

## Known Stubs
None.

## Self-Check: PASSED
