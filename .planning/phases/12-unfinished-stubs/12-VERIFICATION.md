---
phase: 12-unfinished-stubs
verified: 2026-05-31T20:20:00Z
status: human_needed
score: 15/16 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Activate Bagga of Greed Piecie in a browser game. Confirm a modal titled 'Bagga of Greed — Discard a Card' opens showing the player's full hand. Select a card and confirm it disappears from hand. Repeat and click 'Keep Both Cards' — confirm no cards are removed."
    expected: "Modal appears, discard choice is reflected in hand, keep-both path removes nothing."
    why_human: "handleActivatePiecie flag-check paths await real DOM modals. The main.js browser script cannot be unit-tested with modal mocking in the current test infrastructure. The checkpoint was approved by the user during plan execution, but no automated assertion covers the in-browser flow."
  - test: "Activate Welloe Force Piecie. Confirm a modal titled 'Welloe Force — Redirect Damage' opens with prompt 'Choose a Mosje to redirect the next incoming damage to.' and lists all non-defeated opponent Mosje names. Select one and confirm subsequent MP loss to the activating player is redirected to that target."
    expected: "Modal appears, redirect is stored in engine, damage to activating player routes to the target Mosje for 3 turns."
    why_human: "Same modal-mocking constraint as Bagga of Greed. Engine redirect is wired in loseMP() and startTurn() but the target-picker UI path is not covered by automated tests."
  - test: "Activate MP Adjuster Piecie. Confirm a modal titled 'MP Adjuster' opens with prompt 'Choose the MP value to set.' and five options: 20 MP, 40 MP, 60 MP, 80 MP, 100 MP. Select one and confirm the Mosje's MP changes to that value. Start the next turn and confirm the value reverts."
    expected: "Modal appears, chosen MP value is applied, revert on next turn start occurs."
    why_human: "Same modal-mocking constraint. The revert logic is in startTurn() (engine-verified by grep) but end-to-end user flow requires browser verification."
---

# Phase 12: Unfinished Stubs Verification Report

**Phase Goal:** Wire all unimplemented status effect stubs into the engine; every pushed status effect is either read somewhere or tagged with a named DEFERRED comment explaining the blocking primitive.
**Verified:** 2026-05-31T20:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A Mosje with MP_LOSS_HALVED active takes half the incoming loss (rounded up) | VERIFIED | `mpManager.js:145-152` — halvingEffect find + Math.ceil(lossAmount/2); test suite passes 691 |
| 2 | A Mosje with MP_LOSS_REDUCTION active takes incoming loss reduced by the effect value | VERIFIED | `mpManager.js:154-162` — reductionEffect find + Math.max(0, lossAmount - value) |
| 3 | The Protector snelle flag reduces loss at the same read-point as the status effect | VERIFIED | `mpManager.js:163-168` — mpLossReduction snelle flag consolidated directly after MP_LOSS_REDUCTION block |
| 4 | A Mosje with WELLOE_SHIELD active stays at 1 MP instead of being sent to Welloe pile | VERIFIED | `victoryChecker.js:93-102` — WELLOE_SHIELD find before negateNextElimination block; early return with mp=1 |
| 5 | effect_ff_haaltje_nemen no longer throws ReferenceError for undefined reduction | VERIFIED | `snelleEffects.js:45` — `const reduction = resilient >= 2 ? 30 : 20` declared before push |
| 6 | All push sites for MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD use non-zero values | VERIFIED | `piecieEffects.js:763,775,787,799,811` — all five MP_LOSS_HALVED pushes have value:1; `piecieEffects.js:502` — MP_LOSS_REDUCTION value:20; `piecieEffects.js:522` — WELLOE_SHIELD value:1. Zero-value grep returned no matches. |
| 7 | negateNextSearch flag cancels opponent-triggered draws, not natural turn draws | VERIFIED | `turnManager.js:141,147-151` — phaseDrawCard signature has `isOpponentTriggered = false`; guard inside `if (isOpponentTriggered)` block |
| 8 | doubleNextPiecie is already implemented — STUB-05 is confirmed complete and documented | VERIFIED | `turnManager.js:623` — `// STUB-05 (doubleNextPiecie / Double Trigger) — IMPLEMENTED` comment present |
| 9 | _dingetjeTochActive flag has a documented consumption point (UI-side validator) | VERIFIED | `turnManager.js:585` — `// STUB-07: UI-side implementation deferred to UI wiring phase.` present |
| 10 | SNOEIERTJE_COST dead push is removed from effect_snoeiertje | VERIFIED | No active SNOEIERTJE_COST push found in piecieEffects.js; only the STUB-08 removal comment at line 265 |
| 11 | Dierenasiel 0-MP guard is documented at engine level in useMosjeAbility | VERIFIED | `turnManager.js:842-844` — `const dierenasielWaiver = gameState.dierenasielActive === true` present with log |
| 12 | Ability activation with Synergy Chamber active costs 5 fewer MP | VERIFIED | `turnManager.js:867` — `getSynergyChambercostReduction(gameState)` called; pre-MP-adjustment applied before fn() dispatch |
| 13 | Bagga of Greed, Welloe Force, MP Adjuster flag checks are wired in main.js | VERIFIED (code) / UNCERTAIN (behavior) | `main.js:1366,1385,1415` — all three flag-check blocks present; handleActivatePiecie is async (line 1305); piecieEffects.js sets _mpAdjusterPending (line 682) instead of mp=50; Welloe Force engine redirect in loseMP() and startTurn() confirmed. Behavioral correctness requires human verification (see Human Verification section). |
| 14 | Emergency Swap has a DEFERRED comment naming the blocking primitive | VERIFIED | `piecieEffects.js:529-538` — full DEFERRED comment with blocking primitive (UI modal + ability registry dispatch), implementation path, and ruling reference |
| 15 | Huisbaas has a DEFERRED comment naming the missing primitive | VERIFIED | `piecieEffects.js:593-598` — PARTIAL/DEFERRED comment; Place destruction is live; deck-search primitive named as blocker |
| 16 | FPS West and Ronald Chef flags have DEFERRED (STUB-16) comments at their set sites | VERIFIED | `mosjeAbilities.js:237` — _ronaldPeek DEFERRED; `mosjeAbilities.js:440` — opponentHandPeeked DEFERRED; both name opponent hand reveal UI in boardRenderer.js as blocking primitive |

**Score:** 15/16 truths fully verified; 1 truth verified at code level but requiring human behavioral verification

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/mpManager.js` | MP_LOSS_HALVED and MP_LOSS_REDUCTION checks in loseMP() | VERIFIED | Lines 144-168; both checks present before dierenasielActive block |
| `src/engine/victoryChecker.js` | WELLOE_SHIELD check in markMosjeDefeated() | VERIFIED | Lines 93-102; inserted before negateNextElimination |
| `src/abilities/piecieEffects.js` | Corrected push site values + DEFERRED comments | VERIFIED | All six zero-value sites corrected; Emergency Swap and Huisbaas DEFERRED comments present; SNOEIERTJE_COST push removed |
| `src/abilities/snelleEffects.js` | Fixed effect_ff_haaltje_nemen with reduction const | VERIFIED | Line 45: `const reduction = resilient >= 2 ? 30 : 20` |
| `src/engine/turnManager.js` | negateNextSearch + isOpponentTriggered + STUB-05/07 + dierenasielWaiver + getSynergyChambercostReduction | VERIFIED | All five items confirmed present in file |
| `src/main.js` | Post-activation flag checks for _baggaDiscard, _welloeForceActive, _mpAdjusterPending | VERIFIED (code) | Lines 1365-1437; all three blocks present; async declared at line 1305 |
| `src/abilities/mosjeAbilities.js` | DEFERRED (STUB-16) comments at opponentHandPeeked and _ronaldPeek | VERIFIED | Lines 237 and 440 |
| `docs/card-reference.md` | Updated status for all 16 stubs | VERIFIED | 128 occurrences of deferred/implemented; Emergency Swap, Huisbaas, FPS West, Ronald Chef all marked deferred with blocking primitives named |
| `tests/engine/stub-engine-wiring.test.ts` | Tests proving all engine effects are applied | VERIFIED | File exists; 691 tests pass (was 536 pre-phase) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/abilities/piecieEffects.js` | `src/engine/mpManager.js` | MP_LOSS_HALVED/MP_LOSS_REDUCTION read in loseMP | WIRED | statusEffects.find() patterns confirmed at lines 145, 155 |
| `src/abilities/piecieEffects.js` | `src/engine/victoryChecker.js` | WELLOE_SHIELD read in markMosjeDefeated | WIRED | statusEffects.find() confirmed at line 95 |
| `src/abilities/snelleEffects.js` | `src/engine/turnManager.js` | negateNextSearch consumed in phaseDrawCard when isOpponentTriggered=true | WIRED | Lines 147-151 of turnManager.js |
| `src/engine/turnManager.js` | `src/abilities/placeEffects.js` | getSynergyChambercostReduction import consumed in useMosjeAbility | WIRED | Line 867 of turnManager.js; placeEffects already imported at top of file |
| `src/main.js handleActivatePiecie` | `src/ui/modalManager.js` | await modal.showCardChoice() for Bagga, showOptionSelect for Welloe Force and MP Adjuster | WIRED (code) | Flag-check blocks confirmed at lines 1365-1437; behavioral verification via human checkpoint |
| `src/abilities/piecieEffects.js effect_welloe_force` | `src/engine/mpManager.js loseMP` | _welloeForceActive engine-level redirect | WIRED | `mpManager.js:65-66` — redirect reads _welloeForceActive.targetSlotId; `turnManager.js:96-102` — expiry in startTurn() |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `mpManager.js loseMP` | halvingEffect, reductionEffect | statusEffects array on mosje slot | Yes — set by piecieEffects.js push sites with value:1/value:20 | FLOWING |
| `victoryChecker.js markMosjeDefeated` | shieldEffect | statusEffects array on mosje slot | Yes — set by effect_mosje_shield with value:1 | FLOWING |
| `turnManager.js phaseDrawCard` | negateNextSearch flag | _snelleFlags set by snelle effect | Yes — snelleEffects.js sets the flag; guard reads and deletes it | FLOWING |
| `turnManager.js useMosjeAbility` | synergyDiscount | getSynergyChambercostReduction() | Yes — pure function returns 5 when activePlace matches | FLOWING |
| `main.js handleActivatePiecie` | _baggaDiscard / _welloeForceActive / _mpAdjusterPending | engine flags set by piecieEffects.js | Yes — flags confirmed set in piecieEffects.js lines 682, welloe function | FLOWING (code-level); behavioral: HUMAN_NEEDED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| MP_LOSS_HALVED/REDUCTION/WELLOE_SHIELD in test suite | npm test | 691 tests pass | PASS |
| negateNextSearch tests | npm test | Tests 14-16 in stub-engine-wiring.test.ts pass (part of 691) | PASS |
| dierenasielWaiver and Synergy Chamber tests | npm test | Tests 17-23 in stub-engine-wiring.test.ts pass (part of 691) | PASS |
| DEFERRED comment presence (Emergency Swap) | grep | piecieEffects.js:529 — DEFERRED comment confirmed | PASS |
| mp=50 not present in piecieEffects.js | grep | No matches for `mp = 50` in piecieEffects.js | PASS |
| SNOEIERTJE_COST push removed | grep | No active push found; only the STUB-08 removal comment at line 265 | PASS |
| Bagga/Welloe/MP Adjuster browser interaction | Browser manual — see human verification | Not automatable | HUMAN_NEEDED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| STUB-01 | 12-01 | MP_LOSS_HALVED wired in loseMP() | SATISFIED | mpManager.js:144-152 |
| STUB-02 | 12-01 | MP_LOSS_REDUCTION wired in loseMP() | SATISFIED | mpManager.js:154-162; snelleEffects.js:45 |
| STUB-03 | 12-01 | WELLOE_SHIELD wired in markMosjeDefeated() | SATISFIED | victoryChecker.js:93-102 |
| STUB-04 | 12-02 | negateNextSearch wired in phaseDrawCard | SATISFIED | turnManager.js:141,147-151 |
| STUB-05 | 12-02 | doubleNextPiecie confirmed implemented | SATISFIED | turnManager.js:623 comment |
| STUB-06 | 12-01 | effect_ff_haaltje_nemen ReferenceError fixed | SATISFIED | snelleEffects.js:45 |
| STUB-07 | 12-02 | _dingetjeTochActive documented with UI consumption point | SATISFIED | turnManager.js:585 |
| STUB-08 | 12-02 | Dead SNOEIERTJE_COST push removed | SATISFIED | grep: no active push in piecieEffects.js |
| STUB-09 | 12-03 | Dierenasiel 0-MP guard documented in useMosjeAbility | SATISFIED | turnManager.js:842-844 |
| STUB-10 | 12-03 | Synergy Chamber cost reduction wired in useMosjeAbility | SATISFIED | turnManager.js:867 |
| STUB-11 | 12-04 | Bagga of Greed discard picker wired in main.js | SATISFIED (code) / HUMAN_NEEDED (behavior) | main.js:1365-1383 |
| STUB-12 | 12-05 | Emergency Swap DEFERRED with named blocking primitive | SATISFIED | piecieEffects.js:529-538 |
| STUB-13 | 12-05 | Huisbaas DEFERRED with named blocking primitive | SATISFIED | piecieEffects.js:593-607 |
| STUB-14 | 12-04 | Welloe Force redirect target picker + engine redirect | SATISFIED (code) / HUMAN_NEEDED (behavior) | main.js:1384-1412; mpManager.js:65-66; turnManager.js:96-102 |
| STUB-15 | 12-04 | MP Adjuster value picker wired; no hardcoded 50 | SATISFIED (code) / HUMAN_NEEDED (behavior) | main.js:1414-1437; piecieEffects.js:682 |
| STUB-16 | 12-05 | FPS West and Ronald Chef flags tagged with DEFERRED comments | SATISFIED | mosjeAbilities.js:237,440 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/main.js` | 1365-1437 | `await modal.showCardChoice` / `await modal.showOptionSelect` — not unit-tested | INFO | Browser-DOM interaction not covered by automated tests; Task 3 checkpoint (user-approved in browser during plan execution) is the accepted substitute per CLAUDE.md |

No blockers found. The NOT_TESTED annotation is intentional and documented in the plan and summary. All other anti-pattern patterns (return null, empty arrays, hardcoded stubs, TODO comments without DEFERRED labeling) were not found.

### Human Verification Required

#### 1. Bagga of Greed — Discard Modal

**Test:** Open a browser game, get Bagga of Greed into play on the Piecie bench. Activate it. Observe the result.
**Expected:** A modal titled "Bagga of Greed — Discard a Card" appears, showing the player's entire hand as selectable cards. Clicking one card removes it from hand. Using "Keep Both Cards" keeps the hand unchanged. The `_baggaDiscard` flag is deleted either way and normal play resumes.
**Why human:** `handleActivatePiecie` in main.js awaits `modal.showCardChoice()` — a real DOM modal that blocks until user interaction. Vitest cannot mock the ES module export from the browser script without additional test infrastructure. The plan's Task 3 checkpoint was approved by the user, but that constitutes a developer attestation, not a reproducible automated assertion.

#### 2. Welloe Force — Redirect Target Picker + Engine Redirect

**Test:** Activate Welloe Force Piecie. Observe the modal. Select a target Mosje. Then take incoming MP damage and observe where it lands.
**Expected:** Modal titled "Welloe Force — Redirect Damage" with prompt "Choose a Mosje to redirect the next incoming damage to." lists all non-defeated Mosjes. After selection, incoming MP loss to the activating player for the next 3 turns routes to the chosen Mosje. Auto-select fires if only one opponent Mosje exists. Effect cancels cleanly if no opponent Mosjes are active.
**Why human:** Same modal constraint as Bagga. Additionally, the 3-turn redirect persistence and startTurn() expiry require a multi-turn game sequence that is not covered by unit tests.

#### 3. MP Adjuster — Value Picker + Temporary Revert

**Test:** Activate MP Adjuster Piecie. Observe the modal. Select a value. Confirm the board reflects that MP. End the turn and confirm the value reverts.
**Expected:** Modal titled "MP Adjuster" with prompt "Choose the MP value to set." shows five options: 20 MP, 40 MP, 60 MP, 80 MP, 100 MP. Selecting one sets the Mosje's MP to that value immediately. At the start of the player's next turn the delta is reversed and the Mosje returns to its pre-adjustment MP.
**Why human:** Modal constraint plus multi-turn revert behavior requiring startTurn() to execute.

---

### Gaps Summary

No blockers or hard gaps were found. All 16 STUB requirements are accounted for:

- **Implemented (engine-wired):** STUB-01, STUB-02, STUB-03, STUB-04, STUB-05, STUB-06, STUB-08, STUB-09, STUB-10
- **Implemented (UI-wired, code confirmed):** STUB-11, STUB-14, STUB-15 — code present and correct; behavioral verification delegated to human checkpoint per CLAUDE.md
- **Documented with explicit DEFERRED comment:** STUB-07, STUB-12, STUB-13, STUB-16 — each names the specific blocking primitive preventing implementation

The phase goal — "every pushed status effect is either read somewhere or tagged with a named DEFERRED comment" — is achieved at the code level. Human verification is required to confirm the three browser modal interactions behave correctly end-to-end.

---

_Verified: 2026-05-31T20:20:00Z_
_Verifier: Claude (gsd-verifier)_
