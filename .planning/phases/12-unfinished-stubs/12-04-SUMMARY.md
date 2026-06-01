---
phase: 12-unfinished-stubs
plan: "04"
subsystem: ui
tags: [modal, piecie, card-effects, browser-interaction, bagga-of-greed, welloe-force, mp-adjuster]

# Dependency graph
requires:
  - phase: 12-03
    provides: Synergy Chamber and dierenasiel wiring in useMosjeAbility; 691 tests baseline
provides:
  - Bagga of Greed: full-hand discard picker via showCardChoice modal after activation
  - Welloe Force: 3-turn engine-level damage redirect with opponent Mosje target picker via showOptionSelect
  - MP Adjuster: temporary MP adjustment (reverts at turn start) with value picker (20/40/60/80/100 MP) via showOptionSelect
affects:
  - Future plans consuming _welloeForceTarget for damage redirect
  - Any plan touching Bagga of Greed, Welloe Force, or MP Adjuster card definitions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Post-activation flag-check pattern in handleActivatePiecie — check engine-set flags (_baggaDiscard, _welloeForceActive, _mpAdjusterPending) immediately after gameState = newState, before logStateOutcome
    - Async UI gate for piecie effects — flag set by pure engine function, consumed by async main.js handler via modal calls
    - Engine-level damage redirect — loseMP() reads _welloeForceActive.targetSlotId, redirects damage there, decrements turnCount; startTurn() expires expired redirects

key-files:
  created: []
  modified:
    - src/main.js
    - src/abilities/piecieEffects.js
    - src/data/piecies.js
    - src/engine/mpManager.js
    - src/engine/turnManager.js

key-decisions:
  - "Bagga of Greed shows full hand (not just 2 drawn cards) — user-requested change; player picks 1 card to discard from their entire hand after activation"
  - "MP Adjuster is temporary: stores original MP delta, reverts it at next turn start via startTurn() cleanup — not a permanent override"
  - "Welloe Force reworked to 3-turn redirect at engine level in loseMP(): any incoming MP loss to the activating player is redirected to the chosen opponent Mosje for 3 turns"
  - "Welloe Force auto-selects when only 1 opponent Mosje is available (no modal shown)"
  - "Welloe Force cancelled silently if no opponent Mosjes are active (no valid redirect target)"
  - "MP Adjuster rarity raised to 4-star (★★★★), Welloe Force rarity raised to 4-star (★★★★) with mpCost 40"
  - "NOT_TESTED: main.js flag-check paths await real DOM modals; unit tests not feasible without ES module mocking of modal exports; Task 3 checkpoint serves as accepted functional verification"

patterns-established:
  - "Engine flag pattern: pure effect function sets flag on state (_baggaDiscard, _mpAdjusterPending, _welloeForceActive), async UI handler in main.js reads flag and calls modal, deletes flag after resolution"
  - "Engine redirect pattern: _welloeForceActive = { targetSlotId, turnsLeft } stored on gameState; loseMP() checks and routes damage; startTurn() decrements turnsLeft and deletes when expired"

requirements-completed:
  - STUB-11
  - STUB-14
  - STUB-15

# Metrics
duration: multi-session (tasks committed across two sessions)
completed: 2026-05-31
---

# Phase 12 Plan 04: UI-Gated Piecie Interactions Summary

**Three piecie activations fully wired end-to-end: Bagga of Greed full-hand discard picker, Welloe Force 3-turn engine-level damage redirect with target picker, and MP Adjuster temporary value picker (20–100 MP, auto-reverts next turn)**

## Performance

- **Duration:** Multi-session
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 3 (Tasks 1 and 2 auto, Task 3 checkpoint approved by user)
- **Files modified:** 5

## Accomplishments

- Bagga of Greed: activation now opens `showCardChoice` modal showing entire hand; player picks one card to discard, or clicks "Keep Both Cards" to keep all. Flag `_baggaDiscard` cleaned up after modal resolves.
- Welloe Force: completely reworked — 40 MP cost, 4-star rarity, 3-turn engine-level damage redirect wired inside `loseMP()` in mpManager.js; `startTurn()` in turnManager.js decrements and expires the redirect counter. Activation opens `showOptionSelect` modal to pick opponent Mosje target; auto-selects when only one target exists; cancels cleanly if no targets.
- MP Adjuster: hardcoded `mp = 50` replaced with `_mpAdjusterPending` flag; activation opens `showOptionSelect` modal with 20/40/60/80/100 MP options; selected value is applied temporarily (original delta stored, reverted at next `startTurn()` call); rarity raised to 4-star.

## Task Commits

1. **Task 1: Wire Bagga of Greed discard picker and MP Adjuster value picker in main.js** - `e282ff3` (feat)
2. **Task 2: Wire Welloe Force redirect target picker in main.js** - `af4bf6f` (feat)
3. **Post-task rework: MP Adjuster (temp), Bagga of Greed (full hand), Welloe Force (3-turn redirect)** - `f3b91d8` (feat)
4. **Task 3: Checkpoint approved** — human verified in browser; no code commit

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/main.js` — handleActivatePiecie: flag-check blocks for _baggaDiscard, _welloeForceActive, _mpAdjusterPending; all three async modal calls; Bagga shows full hand; Welloe Force auto-select and cancel paths
- `src/abilities/piecieEffects.js` — effect_mp_adjuster replaced `mp = 50` with `_mpAdjusterPending` flag; effect_welloe_force sets `_welloeForceActive = { targetSlotId: null, turnsLeft: 3 }`
- `src/data/piecies.js` — MP Adjuster rarity ★★★★; Welloe Force rarity ★★★★, mpCost 40
- `src/engine/mpManager.js` — loseMP() reads `_welloeForceActive.targetSlotId` and redirects MP loss to that slot instead of the activating player
- `src/engine/turnManager.js` — startTurn() decrements `_welloeForceActive.turnsLeft`, deletes flag when expired; also reverts MP Adjuster temporary delta

## Decisions Made

- Bagga of Greed shows **full hand** (not just the 2 newly drawn cards). User requested this change — more meaningful discard choice.
- MP Adjuster applies a **temporary** value: stores the delta applied, reverts it at the start of the player's next turn. This makes the card a one-turn boost rather than a permanent override.
- Welloe Force implemented as an **engine-level redirect** in loseMP() rather than a UI-only stub. 3-turn duration adds meaningful tactical depth. mpCost raised to 40 (4-star) to reflect power.
- Auto-select behaviour for Welloe Force when only 1 opponent Mosje is active avoids unnecessary modal friction.
- Flag-check paths in main.js are NOT unit-tested (browser-DOM async modal calls; ES module mocking not feasible in current test infrastructure). Task 3 checkpoint is the accepted substitute per CLAUDE.md.

## Deviations from Plan

### Post-Approval Reworks (User-Requested)

**1. Bagga of Greed — full hand instead of last-2-drawn**
- **Found during:** User review after Task 1 commit
- **Issue:** Showing only the 2 drawn cards limits the card's strategic interest
- **Fix:** `showCardChoice` now passes the player's full hand (mapped through CARD_LOOKUP)
- **Files modified:** src/main.js
- **Committed in:** f3b91d8

**2. MP Adjuster — temporary effect with revert on next turn start**
- **Found during:** User review after Task 1 commit
- **Issue:** Permanently overwriting the Mosje's MP made the card too strong and unintuitive
- **Fix:** effect stores delta, startTurn() reverts it; showOptionSelect shows same 5 options
- **Files modified:** src/main.js, src/abilities/piecieEffects.js, src/engine/turnManager.js
- **Committed in:** f3b91d8

**3. Welloe Force — full 3-turn engine-level redirect replacing stub**
- **Found during:** User review after Task 2 commit
- **Issue:** Storing _welloeForceTarget as a string was a half-implementation; the actual redirect logic was missing
- **Fix:** loseMP() in mpManager.js redirects any incoming MP loss to the stored target slot for 3 turns; turnManager.js decrements and expires the counter; piecies.js updated to ★★★★ / 40 MP
- **Files modified:** src/main.js, src/abilities/piecieEffects.js, src/data/piecies.js, src/engine/mpManager.js, src/engine/turnManager.js
- **Committed in:** f3b91d8

---

**Total deviations:** 3 (all user-requested post-approval reworks)
**Impact on plan:** All changes improve the actual card mechanics — full implementation rather than UI-only stubs. No scope creep; all work stays within the three targeted cards.

## Issues Encountered

None during planned task execution. The rework commit f3b91d8 was user-driven after reviewing the initial implementation in the browser.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — all three cards are fully implemented end-to-end (engine flag, UI picker, state mutation, cleanup).

## Next Phase Readiness

- STUB-11 (Bagga of Greed), STUB-14 (Welloe Force), STUB-15 (MP Adjuster) are resolved
- Welloe Force damage redirect is live in loseMP() — no future plan needs to wire the consumer
- 691 tests passing, 0 regressions
- Remaining stubs from the phase 12 audit (if any) can continue on this branch

## Self-Check: PASSED

- src/main.js: _baggaDiscard, _welloeForceActive, _mpAdjusterPending flag checks confirmed present (grep verified)
- src/abilities/piecieEffects.js: _mpAdjusterPending confirmed, mp=50 confirmed absent
- Commits e282ff3, af4bf6f, f3b91d8 confirmed in git log
- 691 tests passing (npm test output confirmed)

---
*Phase: 12-unfinished-stubs*
*Completed: 2026-05-31*
