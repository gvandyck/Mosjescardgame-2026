---
phase: 18-dead-flag-fixes
plan: 02
subsystem: card-engine
tags: [mosje-abilities, dead-flags, ronald, ming, tuk, piecies, quest-deck, ui-modals, mp]

# Dependency graph
requires:
  - phase: 18-dead-flag-fixes (plan 01)
    provides: dead-flag consumption pattern; piecieEffects persistUntilEndOfTurn cards
  - phase: 11-engine-complete
    provides: useMosjeAbility dispatch, piecieEffects effect functions, PIECIES data
provides:
  - "Ronald Mastermind Master Plan: play any Piecie from your discard for free, resolve it, persist if persistUntilEndOfTurn else discard; once per game (masterPlanUsed)"
  - "Ming Predictor Future Sight: pay 10 MP, peek top shared General Quest, optionally send it to the bottom (_pendingTargets.mingSendToBottom)"
  - "Tuk Architect Perfect Placement: pay 15 MP, peek top 5 of own deck, take 2 to hand, bottom the other 3 (_pendingTargets.tukChosenCardIds); no face-down placement"
  - "_masterPlanPeek / _mingPredictorPeek / _architectPeek dead flags removed — replaced by real consumers"
  - "Tuk abilityDescription updated to drop the face-down free-placement clause"
affects: [card-reference, ui-layer, multiplayer-sync, future-mosje-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead-flag replacement: a set-but-unread peek flag that contradicts card text is a bug — replace with a real effect that consumes a UI selection from _pendingTargets"
    - "Cross-module ability composition: a Mosje ability runs a Piecie effect via `import * as piecieEffects` (one-way import; piecieEffects never imports mosjeAbilities — no cycle)"
    - "Two sequential showCardChoice picks substitute for multi-select when the modal helper only supports single picks"

key-files:
  created:
    - tests/abilities/dead-flag-mosje.test.ts
  modified:
    - src/abilities/mosjeAbilities.js
    - src/main.js
    - src/data/mosjes.js

key-decisions:
  - "Tuk modal uses two sequential single-pick showCardChoice calls (removing the first pick from the second list) because showCardChoice has no multi-select mode"
  - "Ming/Tuk modals use allowCancel:true so the player can back out before paying MP; Ronald shows an info modal and aborts when the discard holds no Piecie"
  - "Reused the existing CARD_LOOKUP map and the West/Binti post-call structure verbatim (animateFieldActivation → gameState=newState → log.add → logStateOutcome → syncPush → FINISHED check → renderAndAnimate → return)"

patterns-established:
  - "Mosje ability that plays a card: pre-pick in UI → store id in _pendingTargets → useMosjeAbility (which clones + try/catches) → render"
  - "Ability MP/once-per-game guards live inside the ability function and throw; useMosjeAbility converts the throw into {success:false, error} for the modal"

requirements-completed: [DEADFLAG-04, DEADFLAG-05, DEADFLAG-06]

# Metrics
duration: 4min
completed: 2026-06-02
---

# Phase 18 Plan 02: Dead-Flag Mosje Ability Fixes Summary

**Ronald Mastermind, Ming Predictor, and Tuk Architect now do what their cards say — play a Piecie from discard for free, peek/bottom the top General Quest for 10 MP, and peek-5/take-2/bottom-3 for 15 MP — replacing three peek flags that were set but never read.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-02T13:01:34Z
- **Completed:** 2026-06-02T13:05:38Z
- **Tasks:** 2 (RED + GREEN)
- **Files modified:** 3 source + 1 test created

## Accomplishments
- **Ronald Mastermind — Master Plan** now pulls the chosen Piecie out of the player's discard, runs its effect for free via `piecieEffects[def.effectId]`, then either keeps it on the field (`persistUntilEoT: true` in the first empty `piecieSlot`) when the def is `persistUntilEndOfTurn`, or returns it to discard. Guarded once-per-game by `masterPlanUsed`. Previously it wrongly rotated the shared quest deck and set the dead `_masterPlanPeek` flag.
- **Ming Predictor — Future Sight** now charges 10 MP, reveals the top `sharedGeneralQuestDeck` card, and moves it to the bottom when the UI sets `_pendingTargets.mingSendToBottom`. Previously it peeked the player's own deck and set the dead `_mingPredictorPeek` flag.
- **Tuk Architect — Perfect Placement** now charges 15 MP, takes the 2 chosen cards (`_pendingTargets.tukChosenCardIds`) from the top 5 of the deck into the hand, and sends the other 3 to the bottom. No face-down placement. Previously it reordered the top 3 and set the dead `_architectPeek` flag.
- **main.js `handleUseAbility`** gained three selection-modal blocks (`RONALD_MASTERMIND_IDS`, `MING_FUTURE_SIGHT_IDS`, `TUK_PERFECT_PLACEMENT_IDS`) that mirror the existing West/Binti post-call structure exactly.
- **Tuk `abilityDescription`** updated in mosjes.js to drop the "if both are Piecies place 1 face-down for free" clause.
- **No circular import:** `mosjeAbilities.js` adds `import * as piecieEffects from './piecieEffects.js'` and `import { PIECIES } from '../data/piecies.js'`; `piecieEffects.js` does not import `mosjeAbilities.js` (verified) — one-way only.

## Task Commits

Each task was committed atomically (TDD: test → fix):

1. **Task 1: RED — failing tests for the three rewritten abilities** - `c64ac89` (test)
2. **Task 2: GREEN — rewrite abilities + wire main.js modals + update description** - `db71114` (fix)

**Plan metadata:** _this summary commit_ (docs)

## Files Created/Modified
- `tests/abilities/dead-flag-mosje.test.ts` - 8 tests: Ming charges 10 MP + bottoms top quest (and leaves it when false); Tuk charges 15 MP + takes 2 to hand + bottoms 3 (and throws without selection); Ronald plays a non-persistent Piecie (effect ran, removed from discard, ends in discard, masterPlanUsed set), keeps a persistent Piecie on the field, and throws when masterPlanUsed already true; Tuk abilityDescription has no 'face-down'.
- `src/abilities/mosjeAbilities.js` - two new top-of-file imports; three ability functions rewritten per the plan's `<interfaces>`.
- `src/main.js` - three new ID sets + three pre-pick selection-modal blocks in `handleUseAbility`.
- `src/data/mosjes.js` - `mosje_tuk_architect.abilityDescription` rewritten without the face-down clause.

## Decisions Made
- **Tuk two-pick UI:** `showCardChoice(title, cards)` resolves to a single card (or null on cancel) — it has no multi-select mode. So Tuk does two sequential picks, filtering the first choice out of the second list, then collects both ids into `tukChosenCardIds`. Adapted to the real helper signature rather than assuming a multiselect.
- **Cancel handling:** Ming and Tuk pass `allowCancel: true` to their modals so the player can abort before MP is charged; if any pick returns null the handler returns without calling `useMosjeAbility`. Ronald shows an info modal ("No Piecie in your discard") and aborts when the filtered discard is empty.
- **Reused exact post-call flow:** copied the West/Binti block structure verbatim (`animateFieldActivation` → `gameState = newState` → `log.add` → `logStateOutcome` → `syncPush` → FINISHED check → `renderAndAnimate` → `return`) so the three new blocks integrate identically.

## Deviations from Plan

None — plan executed exactly as written. The three ability functions match the plan's `<interfaces>` verbatim; the imports, ID sets, modal blocks, and description change were applied as specified.

The only adaptation (anticipated by the plan itself) was Tuk's UI: the plan said "two sequential picks ... or a multiselect if showCardChoice supports it — otherwise two picks, removing the first from the second list." The real `showCardChoice(title, cards)` signature supports only single picks, so the two-sequential-picks path was used as the plan instructed. This is a documented adaptation, not a deviation from intended behavior.

## Issues Encountered
None. The West/Binti blocks, `useMosjeAbility` dispatch (clones state, try/catches ability throws into `{success, error}`), `CARD_LOOKUP`, and the modal helper signatures (`showCardChoice` / `showRevealedCard` / `showOptionSelect`) all matched the plan's assumptions. `piecieEffects.js` confirmed not to import `mosjeAbilities.js` — no circular import. Test fixtures (player shape, `piecieSlots: [null,null,null,null]`, `turnNumber`) mirrored the existing `dead-flag-engine.test.ts` and worked first try.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three more dead peek flags are gone; the three abilities now match their card text and consume real UI selections via `_pendingTargets`.
- MP-touching change verified per CLAUDE.md: full suite (837 tests, incl. MP-stacking tests) green; simulation 100 games, 0 crashes, 0 timeouts.
- The bot driver path is unaffected — without `_pendingTargets` the abilities throw, and `useMosjeAbility` treats that as "unusable" (same as Binti), so the simulation cleanly skips them rather than crashing.
- Remaining `face-down` mentions in mosjes.js are on Chris/Youri/Chris DDR (out of scope for this plan) and were intentionally left untouched.

---

## Verification Results

1. `npm test` → **837 passed** (829 existing + 8 new), 91 files, 0 failures ✓ (target was 821+)
2. `grep -c "_masterPlanPeek\|_mingPredictorPeek\|_architectPeek" src/abilities/mosjeAbilities.js` → **0** ✓
3. Tuk `abilityDescription` line (mosjes.js:628) no longer contains 'face-down' — confirmed by the dead-flag-mosje test and by grep (the 5 remaining `face-down` hits are all on Chris/Youri/Chris DDR, lines 317/319/335/337/648, not Tuk) ✓
4. Simulation (`npx tsx src/simulation/run-once.ts`) → 100 games, **0 crashes, 0 timeouts** ✓
5. No circular import: `piecieEffects.js` does not import `mosjeAbilities.js` (grep → no matches) ✓
6. GREEN commit introduced **no file deletions** (`git diff --diff-filter=D HEAD~1 HEAD` → empty); 45 deletions were replaced function bodies ✓

---

## Self-Check: PASSED

- FOUND: tests/abilities/dead-flag-mosje.test.ts
- FOUND: src/abilities/mosjeAbilities.js (3 rewritten functions + 2 imports)
- FOUND: src/main.js (3 selection-modal blocks)
- FOUND: src/data/mosjes.js (Tuk description updated)
- FOUND: .planning/phases/18-dead-flag-fixes/18-02-SUMMARY.md
- FOUND commit: c64ac89 (RED)
- FOUND commit: db71114 (GREEN)

---
*Phase: 18-dead-flag-fixes*
*Completed: 2026-06-02*
