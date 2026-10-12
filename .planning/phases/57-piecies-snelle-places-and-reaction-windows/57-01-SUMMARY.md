---
phase: 57
plan: 01
requirements-completed: []
key-files:
  created: [src/engine/table/isPiecieReady.js, tests/engine/piecie-timing.test.ts, tests/helpers/piecieUi.js, tests/ui/piecie-activate-headless.spec.js]
  modified: [src/engine/turnManager.js, src/engine/quests/isReadyPiecieSlot.js, src/bot/botDriver.js, src/bot/strategy/planPiecieActivations.js, src/main.js, src/data/snellePiecies.js, tests/ui/mechanics.spec.js]
---
# Phase 57 Plan 01: Piecie readiness and 3 slots Summary

One readiness rule (`isPiecieReady`, fail closed, no `playedOnTurn+1` fallback) now feeds engine, bot, UI and quest costs; playPiecie allows 3 Piecie-only slots (E22 green). Commits d2f7cc4, 9a98685.

## Deviations
- **Activate-button bug NOT reproducible.** A headless Chromium spec (kannetje_melk and quest_prep) and un-fixme'd VIS-01/02/08 passed 8/8 and 3/3 even on the pre-change code (src files checked out from HEAD~1). 56-09 recorded VIS-08 as 1-of-3, so it was a flake, most likely load or timing, not a code defect. No UI fix was made. The spec stays as a regression guard; VIS-01/02/08 are re-enabled.
- [Rule 3] Fixtures in quest-costs.test.ts and quest-attempt.test.ts gained `type: 'PIECIE'` (real slots always have it; no assertion changed).
- [Rule 3] Jammertje Gepakt description in snellePiecies.js lost "or plays a Snelle" (docs ruling 07d663a); the Card List test was red at HEAD. Plan 57-05 owns the effect.
- TABLE-02 not ticked: Stays lifecycle is plan 57-02.

## Verification
`npm test` 122 files green; all UI and touched src files pass `node --check`; temp headless config deleted, no server left running.
