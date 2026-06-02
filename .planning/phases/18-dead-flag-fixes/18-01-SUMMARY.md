---
phase: 18-dead-flag-fixes
plan: 01
subsystem: card-engine
tags: [piecies, dead-flags, quest, snelle, mp, persistence]

# Dependency graph
requires:
  - phase: 11-engine-complete
    provides: piecieEffects / questLogic / turnManager dead-flag setters
provides:
  - "_snelleBlocked consumed: Those Eyelashes blocks the opponent's Snelle plays for the turn"
  - "_battleConcertActive consumed: Battle Concert redirects Alyssa quest-failure MP to an opponent (once)"
  - "_rerollGranted consumed: Tweede Kans grants one reroll on the next quest dice roll"
  - "persistUntilEndOfTurn on tweede_kans / battle_concert / those_eyelashes so they stay visible while their effect is pending"
  - "startTurn flag hygiene clears all three single-turn flags"
affects: [card-reference, future-piecie-additions, multiplayer-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead-flag consumption: every effect flag set on state must have a reader that consumes and clears it"
    - "failRedirected local guard: redirect MP loss to a new target while skipping the original target's loss path"
    - "Turn hygiene: startTurn deletes single-turn flags so an unconsumed flag never leaks across turns"

key-files:
  created:
    - tests/abilities/dead-flag-engine.test.ts
  modified:
    - src/abilities/piecieEffects.js
    - src/abilities/questLogic.js
    - src/engine/turnManager.js
    - src/main.js
    - src/data/piecies.js

key-decisions:
  - "Reused existing oppIds[0] in effect_those_eyelashes instead of adding a redundant oppId2 lookup (interface explicitly permitted reuse)"
  - "Guarded the Battle Concert redirect with !baseQuestMpBlocked so The Void still nullifies all quest MP movement"
  - "Used replace_all for the two identical showDiceRoll options lines after scoping tweedeKansReroll inside each quest-flow function"

patterns-established:
  - "Dead-flag consumption + clear: a set-but-unread state flag is a bug; wire a reader and delete the flag after use"
  - "failRedirected guard: when redirecting damage, skip BOTH the new-format and old-format loss paths for the original target"

requirements-completed: [DEADFLAG-01, DEADFLAG-02, DEADFLAG-03]

# Metrics
duration: 5min
completed: 2026-06-02
---

# Phase 18 Plan 01: Dead-Flag Piecie Fixes Summary

**Three Piecies (Those Eyelashes, Battle Concert, Tweede Kans) whose effect flags were set but never read are now fully consumed — Snelle-block, Alyssa quest-failure redirect, and an extra quest reroll all work — and all three persist on the field until the end-of-turn sweep.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-02T12:53:22Z
- **Completed:** 2026-06-02T12:58:02Z
- **Tasks:** 2 (RED + GREEN)
- **Files modified:** 5 source + 1 test created

## Accomplishments
- **Those Eyelashes** — `effect_those_eyelashes` now stores the blocked opponent's `playerId` (was boolean `true`), and `playSnellie` rejects a Snelle from that player while the flag is set.
- **Battle Concert** — `resolveQuest` redirects Alyssa's quest-failure MP to an opponent's first active Mosje when `_battleConcertActive` is set, then clears the flag. A `failRedirected` local guard skips both the new-format and old-format failMP paths so Alyssa is never double-hit.
- **Tweede Kans** — both quest dice flows in `main.js` (`runGeneralQuestDiceRoll` and `runQuestDiceRoll`) read and clear `_rerollGranted`, folding one extra reroll into the existing `skiffaRerolls` count.
- **Persistence** — `persistUntilEndOfTurn: true` added to `piecie_tweede_kans`, `piecie_battle_concert`, and `piecie_those_eyelashes` (now 5 total in the file, matching Lucky Coin / Redbull pattern).
- **Flag hygiene** — `startTurn` deletes `_snelleBlocked`, `_battleConcertActive`, and `_rerollGranted` so an unconsumed flag never leaks into a later turn.

## Task Commits

Each task was committed atomically (TDD: test → fix):

1. **Task 1: RED — failing tests** - `3cf0e54` (test)
2. **Task 2: GREEN — implementation + persistence + flag hygiene** - `dceba4f` (fix)

**Plan metadata:** _this summary commit_ (docs)

## Files Created/Modified
- `tests/abilities/dead-flag-engine.test.ts` - 8 tests: playSnellie block guard (both directions), `effect_those_eyelashes` stores opponent id, three persistence checks, Battle Concert redirect (Alyssa) + negative control (non-Alyssa).
- `src/abilities/piecieEffects.js` - `effect_those_eyelashes` stores `oppIds[0]` into `_snelleBlocked` instead of `true`.
- `src/abilities/questLogic.js` - Battle Concert redirect block in `resolveQuest` with `failRedirected` guard on both failMP loss paths.
- `src/engine/turnManager.js` - `playSnellie` `_snelleBlocked === playerId` rejection guard; `startTurn` deletes the three flags.
- `src/main.js` - both quest dice flows consume `_rerollGranted` into `skiffaRerolls`.
- `src/data/piecies.js` - `persistUntilEndOfTurn: true` on the three card defs.

## Decisions Made
- **Reused `oppIds[0]`** in `effect_those_eyelashes` rather than adding the interface's suggested `oppId2` lookup — the function already computes `oppIds` for its discard loop, and the interface explicitly allowed reuse. Functionally identical (first opponent id) in a 2-player game.
- **Guarded the redirect with `!baseQuestMpBlocked`** so The Void (`place_the_void`) still nullifies all quest MP movement — the redirect does not sneak MP loss through under The Void.
- **`replace_all` on the two identical `showDiceRoll` options lines** — safe because `tweedeKansReroll` is declared inside each quest-flow function before its respective `showDiceRoll` call.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed negative-control test fixture cardId**
- **Found during:** Task 2 (GREEN)
- **Issue:** The "does NOT redirect when Mosje is not Alyssa" control test used cardId `"mosje_not_alyssa"`, which contains the substring `"alyssa"`. The implementation's `String(cardId).includes('alyssa')` check (per the plan's interface) therefore matched it and (correctly, per spec) redirected — failing the negative control. This was a flaw in my own test fixture, not the implementation.
- **Fix:** Changed the negative-control cardId to `"mosje_jisca"` (genuinely does not contain "alyssa").
- **Files modified:** tests/abilities/dead-flag-engine.test.ts
- **Verification:** All 8 tests pass; the redirect fires only for Alyssa.
- **Committed in:** `dceba4f` (folded into GREEN commit — the RED commit predates the fixture fix)

---

**Total deviations:** 1 auto-fixed (1 bug, in test fixture only — no implementation deviation from the plan's interface).
**Impact on plan:** None on production code. The implementation matches the plan's `<interfaces>` exactly; only my test's negative-control fixture needed a non-"alyssa" cardId. No scope creep.

## Issues Encountered
None — the adaptive `resolveQuest` and `main.js` edits matched the real variable names (`slotIndex`, `questCard.failMP`, `gameState`, `skiffaRerolls`) cleanly. The `<interfaces>` line-number hints were approximate (lines had shifted), but the surrounding-code anchors were exact.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three dead flags are now consumed and cleared; the corresponding cards persist on the field while their effect is pending.
- MP-touching change verified: full suite (829 tests, incl. MP-stacking tests) green; simulation 100 games, 0 crashes, 0 timeouts.
- Remaining dead flags (if any) are out of scope for this plan and were not touched.

---

## Verification Results

1. `npm test` → **829 passed** (821 existing + 8 new), 90 files, 0 failures ✓
2. `grep -c "_snelleBlocked" src/engine/turnManager.js` → **2** (guard + reset) ✓
3. `grep -c "_battleConcertActive" src/abilities/questLogic.js` → **2** (read + delete) ✓
4. `grep -c "_rerollGranted" src/main.js` → **4** (both quest flows: read + delete each) ✓
5. `grep -c "persistUntilEndOfTurn: true" src/data/piecies.js` → **5** (2 existing + 3 new) ✓
6. Simulation (`npx tsx src/simulation/run-once.ts`) → 100 games, **0 crashes, 0 timeouts** ✓

---

## Self-Check: PASSED

- FOUND: tests/abilities/dead-flag-engine.test.ts
- FOUND: .planning/phases/18-dead-flag-fixes/18-01-SUMMARY.md
- FOUND commit: 3cf0e54 (RED)
- FOUND commit: dceba4f (GREEN)

---
*Phase: 18-dead-flag-fixes*
*Completed: 2026-06-02*
