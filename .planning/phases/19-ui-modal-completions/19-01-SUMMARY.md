---
phase: 19-ui-modal-completions
plan: 01
subsystem: ui
tags: [mosje-ability, fps-west, guess-game, mp, modal, vitest]

# Dependency graph
requires:
  - phase: 18-dead-flags
    provides: "_pendingTargets UI->ability handoff pattern (West/Binti); loseMP routing for visible/logged MP changes"
provides:
  - "FPS West Tactical Analysis reworked into an opponent-hand card-type guessing game: correct +70 MP, wrong -20 MP (routed through gainMP/loseMP)"
  - "main.js handleUseAbility FPS West block reusing the Geen Raad pick->guess->reveal modal flow"
  - "Dead opponentHandPeeked flag fully removed from the abilities layer"
affects: [ui-modal-completions, mosje-abilities, additional-cards]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UI-driven Mosje ability: main.js runs the interactive flow, writes the outcome to _pendingTargets, the pure ability resolves and deletes the flag"
    - "±MP always routed through gainMP/loseMP (never raw mp +=) so it animates and logs"

key-files:
  created:
    - tests/abilities/fps-west-guess.test.ts
  modified:
    - src/abilities/mosjeAbilities.js
    - src/main.js
    - src/data/mosjes.js

key-decisions:
  - "Test FPS West starting MP set to 25 (not the plan's illustrative 50): gainMP runs checkLevelUp, so 50+70=120 would level-up to mp=20 and mask the +70 delta. mp=25 keeps both branches (95 / 5) clear of the level-up (100) and clamp (0) edges while still proving the +70/-20 contract."
  - "main.js log label kept as the plan's explicit 'FPS West Tactical Analysis' string; the FINISHED handler + helper names (useMosjeAbility, animateFieldActivation, logStateOutcome, syncPush, stopListening, renderAndAnimate) match the Binti block exactly."

patterns-established:
  - "Guess-game Mosje ability mirrors the Geen Raad quest UI (showOpponentHandCardSelect -> showCardTypeSelect -> showRevealedCard) but rewards the Mosje's own slot."

requirements-completed: [UICARD-01]

# Metrics
duration: 4 min
completed: 2026-06-02
---

# Phase 19 Plan 01: FPS West Tactical Analysis Guess Game Summary

**FPS West "Tactical Analysis" reworked from a dead-flag stub (draw 1 + unread opponentHandPeeked) into a card-type guessing game against the opponent's hand — correct +70 MP, wrong -20 MP, routed through gainMP/loseMP so it animates and logs.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-02T20:01:42+02:00 (RED commit)
- **Completed:** 2026-06-02T20:04:09+02:00 (GREEN commit)
- **Tasks:** 2 (RED, GREEN)
- **Files modified:** 3 (+1 test file created)

## Accomplishments
- Rewrote `ability_fps_west_tactical_analysis` as a thin MP resolver driven by `_pendingTargets.fpsWestGuessCorrect`: `+70` via `gainMP` on a correct guess, `-20` via `loseMP` on a wrong one; throws when no guess is supplied; deletes the flag after applying it (stale re-read mitigated).
- Removed the dead behaviour entirely — no card draw, and `opponentHandPeeked` no longer exists anywhere in the abilities layer.
- Added the `FPS_WEST_TACTICAL_IDS` block to `handleUseAbility` in `main.js`, reusing the Geen Raad pick→guess→reveal modal flow and the Binti post-call structure (success guard → animate → log → logStateOutcome → syncPush → FINISHED check → renderAndAnimate); guards an empty opponent hand with `showInfo` before consuming the ability.
- Rewrote `mosje_fps_west.abilityDescription` to the guess-game text and archived the legacy description as an adjacent comment for easy revert.

## Task Commits

Each task was committed atomically (TDD: test → feat):

1. **Task 1: RED — failing tests** - `76c799f` (test)
2. **Task 2: GREEN — ability + main.js block + description** - `d0ebc9a` (feat)

**Plan metadata:** see the `docs(19-01)` commit for this SUMMARY.

## Files Created/Modified
- `tests/abilities/fps-west-guess.test.ts` - 5 tests: correct +70, wrong -20, no draw / no opponentHandPeeked, throws without a guess, description contains 'Guess'/'70' and drops 'predict'/'Pay 10 MP'.
- `src/abilities/mosjeAbilities.js` - imports `gainMP` alongside `loseMP`; FPS West function replaced with the guess resolver.
- `src/main.js` - `FPS_WEST_TACTICAL_IDS` set + guess block in `handleUseAbility`.
- `src/data/mosjes.js` - new `abilityDescription` for `mosje_fps_west`; old text preserved as a comment.

## Decisions Made
- **Test starting MP = 25 instead of the plan's illustrative 50.** `gainMP` always runs `checkLevelUp` (level-up at `mp >= 100`). From 50, a correct +70 → 120 → level-up → `mp = 20, level = 2`, which would make the literal `mp === 120` assertion in the plan's `<action>` fail against a correct implementation. Starting at 25 yields 95 (correct) and 5 (wrong) — both clear of the level-up (100) and clamp (0) boundaries — so the assertions cleanly prove the +70/-20 contract that the plan's `<behavior>` actually specifies. The test file documents this inline.
- **Log label** uses the plan's explicit `'FPS West Tactical Analysis'` string; all FINISHED-handler helper names match the Binti block verbatim.

## Deviations from Plan

### Adjusted test assertions to match real engine behavior

**1. [Rule 1 - Bug] Plan's literal MP assertions (120 / 30) contradicted gainMP's checkLevelUp**
- **Found during:** Task 1 (RED test authoring)
- **Issue:** The plan's `<action>` said to start FPS West at `mp = 50` and assert slot `mp = 120` (correct) / `30` (wrong). But `gainMP` always calls `checkLevelUp`, so 50 + 70 = 120 triggers a level-up (mp → 20, level → 2). Asserting `mp === 120` would have made the GREEN step fail even with a correct implementation — i.e., the test would encode wrong behavior. The plan's `<behavior>` (the source of truth) only requires "+70 MP" / "-20 MP".
- **Fix:** Started FPS West at `mp = 25` so correct → 95 and wrong → 5, neither crossing the level-up (100) or clamp (0) boundary. The +70/-20 contract is tested unambiguously; the wrong-guess clamp/level behavior is intentionally not exercised here. Inline comments in the test explain the choice.
- **Files modified:** tests/abilities/fps-west-guess.test.ts
- **Verification:** RED — all 5 new tests failed against the old ability (837 others still passed). GREEN — all 5 passed; engine logs confirm `gainMP`/`loseMP` routing (`💥 gains 70 MP`, `📉 loses 20 MP`).
- **Committed in:** 76c799f (RED), confirmed green by d0ebc9a (GREEN)

---

**Total deviations:** 1 adjusted (1 bug — plan assertion vs. engine reality). No scope change.
**Impact on plan:** The implementation matches the plan's `<interfaces>` verbatim; only the test's concrete MP numbers were adapted so the assertions describe true engine behavior. No source-code deviation.

## Issues Encountered
None — the `<interfaces>` code applied cleanly; the in-scope helpers (`CARD_LOOKUP`, `localPlayerId`, `abilitySlotIndex`, `beforeAbility`, `useMosjeAbility`, `animateFieldActivation`, `logStateOutcome`, `syncPush`, `stopListening`, `renderAndAnimate`, `modal.*`) all matched the West/Binti blocks.

## User Setup Required
None - no external service configuration required.

## Verification
1. `npm test` — **842 passed** (837 pre-existing + 5 new), 92 files. ✓ (≥837)
2. `grep -c fpsWestGuessCorrect src/abilities/mosjeAbilities.js` → **3**; `src/main.js` → **1**. ✓ (both ≥1)
3. `grep -c opponentHandPeeked src/abilities/mosjeAbilities.js` → **0** (fully removed). ✓
4. `grep "Guess a card type" src/data/mosjes.js` → present. ✓
5. Simulation (`npx tsx src/simulation/run-once.ts`) — 100 games, **0 crashes, 0 timeouts**. ✓
6. Ronald Kip stacking test (`tests/cards/phase4a-step2-food-synergy.test.ts`) — 4 passed (MP-change due-diligence per CLAUDE.md). ✓

## Next Phase Readiness
- FPS West is now a fully playable guess game in the UI; ready for the next Phase 19 plan (Ronald hand-lock) and Phase 20 (Leipe Swap MP-swap).
- No blockers.

## Self-Check: PASSED
- `tests/abilities/fps-west-guess.test.ts` — FOUND
- `.planning/phases/19-ui-modal-completions/19-01-SUMMARY.md` — FOUND
- RED commit `76c799f` — FOUND
- GREEN commit `d0ebc9a` — FOUND

---
*Phase: 19-ui-modal-completions*
*Completed: 2026-06-02*
