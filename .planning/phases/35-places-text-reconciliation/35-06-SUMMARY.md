---
phase: 35-places-text-reconciliation
plan: 06
subsystem: engine+ui
tags: [places, synergy, mosje, quest-logic, ui, pills, tdd, human-verify]

# Dependency graph
requires:
  - phase: 35-places-text-reconciliation
    provides: "Places text-vs-engine audit ruling record (35-CONTEXT.md D-11) that this plan implements"
provides:
  - "The 3 undocumented Synergy Chamber bonuses (cost -5, dice +1, duration +1) fully removed"
  - "Once-per-turn synergy-partner waiver (synergyWaiverActive) implemented, bypassing the 2 real shared-utility partner-gate consumers (hasFoodDoubleSynergy, getPartnerSynergyQuestBonus)"
  - "New UI: waiver button lives on the Synergy Chamber card itself (not a separate top-bar control), reusing the existing hand-card__play-btn Activate pattern"
  - "New UI: gold 'Synergy Active' pills surface live synergy bonuses proactively (FOOD double, Physical Quest +15), plus a purple 'Synergy Active' pill for the waiver's own used-this-turn state"
  - "Battle log explicitly calls out a partner-synergy quest bonus as its own line, not folded into one combined MP number"
  - "New test hooks (setActivePlace, setTurnNumber) and a cardTypeFor fix (mosje_ prefix was never mapped to type MOSJE) for scenario-driven manual verification"
affects: [35-07, 35-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UI action buttons for Place-triggered player actions belong ON the Place card itself (hand-card__play-btn class, same as face-down Piecie/Place/Personal-Quest Activate buttons), not as bespoke top-bar controls"
    - "Pill system (buildActiveModifiers in main.js) extended with a 'live synergy bonus' category — proactively shows the game-state condition an effect depends on, rather than requiring the player to infer it from an MP delta after the fact"
    - "Transient _questSynergyBonus / _autoAbilityLog style markers: engine functions stash a one-shot value on the returned state for the UI to read-and-delete immediately after logging, keeping engine functions UI-agnostic while still surfacing bonus breakdowns to the player"

key-files:
  created:
    - tests/engine/place-synergy-chamber.test.ts
  modified:
    - src/abilities/placeEffects.js
    - src/engine/turnManager.js
    - src/abilities/questLogic.js
    - src/engine/synergyResolver.js
    - src/main.js
    - src/data/piecies.js
    - game.html
    - tests/engine/stub-engine-wiring.test.ts

key-decisions:
  - "Waiver button relocated mid-verification from a top-bar control to the Synergy Chamber card itself, per Gandoe's explicit UX feedback during the human-verify checkpoint — reuses the same Activate-button pattern already established for face-down Piecies/Places rather than inventing a new control"
  - "Removed the '(50/70 MP with Coert/Binti synergy)' parenthetical from all 3 FOOD Piecies (Kannetje Melk, Broodje Döner, Ronald Kip) per Gandoe's direction — the doubling is Binti's synergy effect, not something these cards should describe themselves; user chose 'all three for consistency' over 'just Kannetje Melk' after being shown the other 2 also had it"
  - "Added a live-synergy-bonus pill system (gold '🍔 FOOD Piecies ×2 (Synergy)' / '+N {category} Quest (Synergy)', purple '🔗 Synergy Active') on Gandoe's request to make a synergy's effect visible before it's exercised, not just inferable from an MP delta afterward"
  - "Battle log now explicitly breaks out a partner-synergy quest bonus into its own log line ('🔗 Includes +N MP from an active synergy bonus') at all 3 quest-resolution call sites (General Quest, Personal Quest, Geen Raad's no-dice path) — engine-level fix via a transient _questSynergyBonus marker, consumed and cleared immediately by the UI"
  - "During manual verification, deeper investigation (prompted by Gandoe questioning pill coverage) found 2 MORE real synergy mechanics beyond the 2 the locked plan enumerated: Chris+Youri (instant Piecie placement) and Chris DDR+DJ 8020 (Perfect Combo Chain roll bonus) — both use their own ad-hoc id-presence checks in turnManager.js, not the shared getActiveSynergies/hasSynergy utility this plan's waiver patches. Explicit decision (2026-07-15): defer extending the waiver to these two, keep this wave's scope matching its locked plan; tracked for a future phase"

requirements-completed: [PLACE-11]

# Metrics
duration: ~3.5hr (including extensive human-verify checkpoint iteration)
completed: 2026-07-15
---

# Phase 35 Plan 06: Synergy Chamber — Dead Bonuses Removed, Partner Waiver Implemented Summary

**Synergy Chamber's 3 undocumented bonuses (never in the card's text) are gone; its actual headline mechanic — waiving the partner-Mosje requirement for a synergy bonus, once per turn — is now real, with a full round of human-verify iteration that surfaced and fixed a UI-placement request, a confusing card-text overlap, a missing pill/log breakdown, and 2 test-hook gaps.**

## Accomplishments

### Tasks 1 & 2 (engine, TDD)
- Deleted `getSynergyChambercostReduction` and `getSynergyChamberDiceBonus` entirely (zero card-text basis); confirmed `getSynergyChamberDurationBonus` had zero consumers and removed it too.
- Removed the `-5` MP ability-cost pre-adjustment block from `useMosjeAbility` (turnManager.js) and the `+1` dice-bonus term from both `quest_req_perfect_timing` (questLogic.js) and both `main.js` quest-attempt dice-bonus sums.
- Added `activateSynergyWaiver(gameState, playerId)` (turnManager.js) — once-per-turn, sets `synergyWaiverActive`, reset in `startTurn`.
- Widened `getActiveSynergies`'s partner-gate (synergyResolver.js) and `getPartnerSynergyQuestBonus`'s gate (questLogic.js) to bypass the partner-presence check when the flag is active — the ONLY 2 real consumers of the shared partner-gate utility (`hasFoodDoubleSynergy` via Binti+Coert-family, and the West+AZN-Cless Physical-quest bonus).
- 8 new tests in `place-synergy-chamber.test.ts`; fixed 3 obsolete pre-existing STUB-10 tests in `stub-engine-wiring.test.ts` that asserted the now-removed cost-discount behavior.

### Human-verify checkpoint (Task 3) — extensive live iteration with Gandoe
- Built a throwaway Playwright launcher (`_scratch-open-synergy-checkpoint.mjs`, not part of the permanent suite) to open real, seeded browser windows for 3 scenarios: Binti alone (FOOD double), Señor West alone, and AZN Cless alone (both sides of the Physical-quest pair).
- **UI relocation:** moved the waiver button from a standalone top-bar control to the Synergy Chamber card itself, reusing the exact `hand-card__play-btn` Activate pattern already used for face-down Piecies/Places/Personal Quests (`boardRenderer.js`, `renderBoard`'s new `onActivateSynergyWaiver` param).
- **Card-text cleanup:** removed the "(50/70 MP with Coert/Binti synergy)" parenthetical from Kannetje Melk, Broodje Döner, and Ronald Kip — confusing and not these cards' own effect.
- **New pill system:** `buildActiveModifiers` (main.js) now shows live synergy bonuses proactively — gold pills for FOOD double and Physical-Quest+15 when currently live (real partner OR waiver), purple "🔗 Synergy Active" when the waiver has been used this turn. New exported `getActivePartnerSynergyBonuses` helper in questLogic.js backs this without exposing the private synergy table to main.js.
- **Battle-log fix:** a partner-synergy quest bonus was being silently folded into one combined MP number (e.g. "+75 MP" instead of showing the +15 breakdown). Fixed via a transient `_questSynergyBonus` marker set in `resolveQuest` (questLogic.js), consumed and logged explicitly at all 3 quest-resolution call sites in main.js (General Quest, Personal Quest, Geen Raad's no-dice path).
- **Test-hook fixes (pre-existing gaps, not part of this plan's original scope):** `cardTypeFor` inside `window.__testHooks` never mapped `mosje_`-prefixed ids to type `MOSJE` (defaulted to `PIECIE`), silently breaking any test-hook `setHand` call with a Mosje id — fixed. Added `setActivePlace` and `setTurnNumber` test hooks (both gated behind `testMode=true`) to support scenario seeding; the latter was needed because `player_1` is always `firstPlayerId` in offline mode and General Quests are hard-blocked on turn 1 (an unrelated 2026-07-12 rule) — surfaced as a misleading "active Mosje has negative MP" message that is actually the `first-turn-lock` reason.
- **Deeper investigation during verification:** enumerated every `synergyWith` pair in `mosjes.js` and cross-checked consumers. Found 2 additional real (but waiver-unaware) mechanics — Chris+Youri and Chris DDR+DJ 8020 — plus confirmed dead pairs (Michelle+Gandoe, FPS Coert+FPS West — the latter stale post-2026-07-13-reconciliation) and a Cless Teacher/AZN Cless text-vs-code divergence (same promised effect, but the engine's table only recognizes AZN Cless). Captured in a new todo (`2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md`) for a future phase, per Gandoe's explicit direction to defer rather than expand this wave's scope.

## Files Created/Modified
- `src/abilities/placeEffects.js` — 3 dead bonus functions removed; `effect_synergy_chamber` reduced to a no-op passive stub
- `src/engine/turnManager.js` — dead `synergyDiscount` block removed; new `activateSynergyWaiver` export; `synergyWaiverActive` reset in `startTurn`
- `src/abilities/questLogic.js` — dead `getSynergyChamberDiceBonus` import/call removed; `getPartnerSynergyQuestBonus`'s gate widened; new `getActivePartnerSynergyBonuses` export; `resolveQuest` stashes `_questSynergyBonus`
- `src/engine/synergyResolver.js` — `getActiveSynergies`'s partner-gate widened
- `src/main.js` — `placeDiceBonus` removed from all 4 dice-bonus-sum sites; `onActivateSynergyWaiver` wired through `renderBoard`; new pill logic in `buildActiveModifiers`; explicit synergy-bonus log line at 3 quest-resolution sites; `cardTypeFor` fix; new `setActivePlace`/`setTurnNumber` test hooks
- `src/ui/boardRenderer.js` — `renderBoard` gained `onActivateSynergyWaiver` param; Synergy Chamber's own active-place-card block gets the Activate button
- `src/data/piecies.js` — Coert/Binti-synergy parenthetical removed from 3 FOOD Piecies
- `game.html` — top-bar waiver button removed (moved to the card)
- `tests/engine/place-synergy-chamber.test.ts` — new: 8 tests across Task 1 (dead-bonus removal) and Task 2 (waiver mechanics)
- `tests/engine/stub-engine-wiring.test.ts` — 3 obsolete STUB-10 tests updated to reflect the removed cost-discount

## Decisions Made
See `key-decisions` above — all made live with Gandoe during the checkpoint, most significantly: UI button placement (card, not top-bar), FOOD-Piecie text cleanup scope (all 3, not just Kannetje Melk), the new pill/log-breakdown feature, and deferring the Chris+Youri/DJ8020 waiver-coverage gap to a future phase rather than expanding this wave.

## Deviations from Plan
The plan's Task 1/2 scope was implemented exactly as written. Everything in the "Human-verify checkpoint" section above is *additional* work that emerged from the mandatory `checkpoint:human-verify` gate itself — Gandoe's live feedback drove UI/UX refinements beyond the plan's original text, which is exactly what that gate exists for.

## Issues Encountered
- `test:sim` briefly appeared stalled during final verification — root cause was resource contention from 3 manual scratch browser windows still open on the same dev server. Closed them and re-ran cleanly (155/160 passed, 5 failures/3.1%, 0 crashes, in ~30 min).
- Own near-miss (already documented in the conversation, not a plan defect): a scenario-script fix I applied only to 2 of 3 branches (west/cless) initially, missing the binti branch — caused a recurrence of the same misleading first-turn-lock message the user had already seen once. Fixed by applying the turn-bump uniformly.

## User Setup Required
None — no external service configuration required.

## Verification Results
- `node --check` on all touched files — clean, no output
- `npm test` (full suite) — 646/646 passing (0 regressions)
- `npm run test:cards` — Ronald Kip stacking entry passes; 51 passed / 9 skipped / 2 failed (same 2 pre-existing unrelated failures as every prior wave)
- `npm run test:sim` — 155/160 passed, 5 failures (3.1%, pre-existing `TimeoutError` class), 0 crashes
- Human-verify checkpoint (Task 3) — **approved** by Gandoe across 3 live scenarios (Binti FOOD-double, Señor West and AZN Cless Physical-quest+15) after iterative UI/UX fixes

## TDD Gate Compliance
Tasks 1 and 2's engine changes followed RED → GREEN in `place-synergy-chamber.test.ts` (8 tests, confirmed failing against pre-fix code first). The checkpoint follow-up work (UI/pills/log/test-hooks) was verification tooling and UX iteration, not new engine behavior requiring its own RED→GREEN cycle — covered instead by the full regression suite staying green throughout.

## Next Phase Readiness
- PLACE-11 is fully reconciled and human-verified; ready for 35-07 (PLACE-05, PLACE-12 — Drain Zone + The Void dead-code cleanup and hide from player-facing pools).
- New future-phase todo captured: `2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md`.
- No blockers for downstream plans in this phase.

---
*Phase: 35-places-text-reconciliation*
*Completed: 2026-07-15*
