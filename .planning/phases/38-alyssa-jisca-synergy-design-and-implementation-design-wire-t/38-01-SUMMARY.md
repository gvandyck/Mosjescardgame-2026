---
phase: 38-alyssa-jisca-synergy
plan: 01
subsystem: card-data-engine
tags: [mosjes, synergy, card-data, playwright, vitest, mp-five-grid]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Synergy Chamber's getActiveSynergies/hasSynergy waiver-aware detection utility, reused unchanged here"
  - phase: 36-mp-cost-model
    provides: "Confirmation that 69/70 Piecies are mpCost:0, which is why D-04 rejects a Piecie cost-discount as a near-total no-op"
provides:
  - "Non-null, convention-compliant synergyEffect text on mosje_alyssa_bulldozer, mosje_alyssa_fissa, mosje_jisca"
  - "hasAlyssaJiscaSynergy(gameState, playerId) detection helper exported from src/engine/synergyResolver.js"
  - "A repro-first RED Playwright spec (tests/ui/cards/alyssa-jisca-synergy.spec.js) proving both halves of the synergy are live no-ops today"
  - "A green resolver unit test (tests/engine/alyssa-jisca-synergy-resolver.test.ts) for the new detection helper"
affects: ["38-02 (engine wiring)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repro-first RED browser test using a bespoke tests/ui/cards/*.spec.js file (not the generic card-registry runner) for a two-Mosje synergy scenario, driven directly via window.__testHooks"
    - "Dual custom-deck seeding (player + bot) by writing two sessionStorage mosjes:customDeck:<id> entries in one addInitScript, since seedCustomDeck (helpers.js) only injects one"
    - "mockDiceRoll(page, 0) used to neutralize a harmless bot's General Quest reward surface, isolating the MP delta under test to just the synergy mechanic"

key-files:
  created:
    - tests/ui/cards/alyssa-jisca-synergy.spec.js
    - tests/engine/alyssa-jisca-synergy-resolver.test.ts
  modified:
    - src/data/mosjes.js
    - src/engine/synergyResolver.js
    - tests/data/synergy-text-clarity.test.ts

key-decisions:
  - "Scenario A measures Alyssa's MP delta across one full turn boundary (endTurnAndWait) against an empty-piecie custom bot deck + mockDiceRoll(0), rather than nulling the opponent's Mosje slots, because victoryChecker.js's KNOCKOUT check treats an opponent field with both slots null as vacuously all-defeated and would end the game instantly."
  - "Scenario B uses piecie_katjegang (a STATUS_EFFECT Piecie with zero own MP effect) as the test Piecie so the only possible MP delta observed is Jisca's synergy bonus itself, not the Piecie's own effect."
  - "Scenario B measures the delta on PLAY (playCardFromHand), not on later activation, because D-03's text ('the first Piecie you PLAY each turn') and the existing playPiecie() hook point (src/engine/turnManager.js:559) both place the natural trigger at placement time, not activation."

patterns-established:
  - "hasAlyssaJiscaSynergy modeled directly on hasFoodDoubleSynergy: a local ID list + hasSynergy(...).some(...), zero new slot-iteration logic — the pattern future synergy-pair helpers (Phase 39) should copy."

requirements-completed: [D-01, D-02, D-03, D-04, D-05]

# Metrics
duration: ~25min
completed: 2026-07-18
---

# Phase 38 Plan 01: Alyssa<->Jisca Synergy — Repro-First Foundation Summary

**Repro-first RED tests for the Alyssa<->Jisca party-amplifier synergy, convention-compliant card text on all 3 duo cards, and a hasAlyssaJiscaSynergy detection helper reusing existing pair-detection — engine wiring itself is deferred to Plan 38-02.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-18T23:19:46Z
- **Tasks:** 3/3 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Wrote and confirmed RED a Playwright browser spec covering both halves of the synergy (Alyssa's +10/turn while Jisca is present; Jisca's +10 on the first Piecie played each turn while an Alyssa is present, once-per-turn capped) — proven live no-ops on current code, exactly as CLAUDE.md's reproduce-first rule requires before any engine change.
- Wrote and confirmed RED a resolver unit test for the not-yet-existing `hasAlyssaJiscaSynergy` helper, then added the helper (Task 3) and confirmed the unit test goes green while the browser spec correctly stays RED (engine effect application is out of scope for this plan).
- Set non-null, convention-compliant `synergyEffect` text on all 3 duo cards and extended `tests/data/synergy-text-clarity.test.ts`'s `REQUIRED_PARTNER_MENTIONS` table so the clarity guard test stays honest and green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the failing repro card-test (RED) + resolver unit test** - `6e18ce9` (test)
2. **Task 2: Set convention-compliant synergyEffect text + update the clarity table** - `6aacc77` (feat)
3. **Task 3: Add hasAlyssaJiscaSynergy detection helper** - `1045350` (feat)

_No TDD-flagged tasks in this plan (`tdd` not set on any task); each task is a single commit._

## Files Created/Modified
- `tests/ui/cards/alyssa-jisca-synergy.spec.js` — repro-first Playwright spec, 2 scenarios (Alyssa +10/turn, Jisca +10 on first Piecie/turn), both confirmed RED on current code.
- `tests/engine/alyssa-jisca-synergy-resolver.test.ts` — 6-case unit test for `hasAlyssaJiscaSynergy` (both Alyssa variants, alone, defeated Jisca); confirmed RED then GREEN.
- `src/data/mosjes.js` — `synergyEffect` text set on `mosje_alyssa_bulldozer`, `mosje_alyssa_fissa`, `mosje_jisca` (was `null` on all 3).
- `src/engine/synergyResolver.js` — new export `hasAlyssaJiscaSynergy(gameState, playerId)`.
- `tests/data/synergy-text-clarity.test.ts` — 3 new `REQUIRED_PARTNER_MENTIONS` entries + updated stale comment.

## Decisions Made
- **Opponent-field "harmless" scenario design (Scenario A):** rather than nulling both of the opponent's Mosje slots to make it truly "empty" (as one plan reading suggested), used a custom bot deck with zero Piecies/Snelle Piecies/Places plus `mockDiceRoll(page, 0)` to force all dice rolls to fail. Nulling both opponent slots would trip `victoryChecker.js`'s `KNOCKOUT` check (`activeSlots.every(slot => slot === null || slot.isDefeated)` is vacuously true for an all-null array), ending the game before the turn-boundary MP comparison could run. This was discovered by reading `victoryChecker.js` directly before writing the test, not by trial and error in the browser.
- **Jisca-side trigger point (Scenario B):** measured the MP delta immediately after `playCardFromHand` (placement), not after a separate `Activate` click, because D-03's own wording ("the first Piecie you PLAY") and the existing `playPiecie()` function (which already tracks `pieciesPlayedThisTurn`/`lastCardPlayedType` at placement time) both point to placement as the natural hook — the eventual wave-2 implementation is expected to hook there, not at Piecie activation.
- **Test isolation Piecie:** chose `piecie_katjegang` (a `STATUS_EFFECT` card with zero own MP effect, per `effect_katjegang` in `piecieEffects.js`) as the Scenario B Piecie so the observed MP delta on Jisca's slot can only be the synergy bonus, never conflated with the card's own gain.
- **D-04 confirmed not implemented:** no Piecie cost-discount language anywhere in the new text (`grep -i "cost.*less|discount"` on `mosjes.js` only matches an unrelated pre-existing card at line 129, `mosje_martin_driver`/similar's Adaptive Combat Flow).

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks' `<action>` and `<acceptance_criteria>` were followed precisely; no Rule 1-4 auto-fixes were needed since this plan deliberately does not touch any consuming/production code path (the engine wiring that would need bugfixing is explicitly wave 2, per this plan's `<done>` criteria and the CONTEXT.md's phase boundary).

## Issues Encountered
None. The one non-obvious risk (opponent-field nulling triggering an accidental instant KNOCKOUT win) was caught by reading `victoryChecker.js` before writing the test, not discovered as a test failure — so it never manifested as a real issue, just informed the test's design (see Decisions Made above).

## User Setup Required
None — no external service configuration required.

## Verification Summary

- `node --check` clean on `src/data/mosjes.js` and `src/engine/synergyResolver.js`.
- `npm test` — 670/670 passing (664 baseline + 6 new resolver tests), 0 regressions.
- `npm test -- synergy-text-clarity` — 3/3 green.
- `npm test -- alyssa-jisca-synergy-resolver` — 6/6 green.
- `npx playwright test --project=cards tests/ui/cards/alyssa-jisca-synergy.spec.js` — 2/2 **RED as expected** (Scenario A: delta=10, expected 20; Scenario B: deltaFirst=0, expected 10). This RED state is the plan's success criterion for this wave, not a failure to fix — engine wiring is Plan 38-02.

## Known Stubs

None that block this plan's own goal (repro-first foundation). The browser card-test's RED assertions are the intentional, documented "stub" this wave leaves behind for Plan 38-02 to resolve — not an accidental gap.

## Next Phase Readiness

Plan 38-02 (engine wiring, not yet planned in detail beyond CONTEXT.md's code-context pointers) can proceed directly:
- `hasAlyssaJiscaSynergy(gameState, playerId)` is ready to consume from `src/engine/turnManager.js` (Alyssa's +10/turn trickle bonus, natural home per CONTEXT.md) and `src/abilities/piecieEffects.js` / `playPiecie()` (Jisca's first-Piecie-per-turn +10, needs a once-per-turn flag reset in `turnManager.js`'s `startTurn`).
- `tests/ui/cards/alyssa-jisca-synergy.spec.js` is the ready-made GREEN target — once wired correctly, both scenarios should flip from RED to GREEN with no changes needed to the test file itself.
- `tests/engine/alyssa-jisca-synergy-resolver.test.ts` already guards the detection helper's contract, so wave 2 can rely on it without re-deriving pair-detection logic.
- No blockers identified.

---
*Phase: 38-alyssa-jisca-synergy*
*Completed: 2026-07-18*

## Self-Check: PASSED

All created files confirmed on disk; all 4 commit hashes (`6e18ce9`, `6aacc77`, `1045350`, `adb5329`) confirmed present in git log.
