---
phase: 27-youri-ability-chris-synergy-fix
verified: 2026-06-12T00:00:00Z
status: verified
score: 13/13 must-haves verified
overrides_applied: 0
resolution: >
  2026-06-12 — All 4 human-needed smoke tests are now AUTOMATED Playwright tests
  in tests/ui/mechanics.spec.js (VIS-05 single auto-activate, VIS-06 3-use cap,
  VIS-06b multi-piecie slot picker, VIS-06c cancel-still-spends-cost). All pass.
  Automating VIS-06c SURFACED A REAL BUG: the Youri cancel + activation-failed
  paths in src/main.js called renderAll() — an undefined function — so the board
  kept stale MP after cancelling (engine state was correct at -20, DOM showed the
  old value). Fixed: renderAll() → renderAndCheckWin() (the standard render used
  everywhere else). 945 unit tests green.
human_verification:
  - test: "Youri ability smoke test in game.html — single face-down piecie"
    expected: "Click Youri's ability button with exactly one face-down piecie on field. Piecie activates immediately. Hand grows by 1 card. Youri slot MP drops by 20. No slot-picker modal appears."
    why_human: "activatePiecie call in single-piecie auto-path depends on live DOM rendering and modal flow; cannot verify without running browser."
  - test: "Youri ability smoke test in game.html — multiple face-down piecies"
    expected: "Click Youri's ability with two or more face-down piecies. A slot-picker modal appears listing named slots. Selecting a slot activates that piecie. Hand grows by 1. Youri MP drops by 20."
    why_human: "modal.showOptionSelect interaction and subsequent activatePiecie call require running game.html."
  - test: "Cancel path — ability cost is irrevocable"
    expected: "Open the slot-picker modal then cancel (or close it). An info modal appears: 'Youri paid 20 MP but no Piecie was selected. The cost is still spent.' Youri MP is still reduced and youriAbilityUses incremented."
    why_human: "Cancel-path state persistence depends on the modal dismiss flow in the browser."
  - test: "3-use cap visible to player"
    expected: "After using Youri's ability 3 times, clicking the ability button shows 'Cannot Use Ability — Youri Speed Activate has already been used 3 times this game' with no MP deducted."
    why_human: "Requires playing a full game session to exhaust the counter."
---

# Phase 27: Youri Ability + Chris+Youri Synergy Fix — Verification Report

**Phase Goal:** Fix Youri Speed Activate ability (20 MP cost, activate face-down piecie, draw 1 card, 3-use cap) and implement Chris+Youri passive synergy (both on field = piecies from hand activatable same turn).
**Verified:** 2026-06-05T23:16:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `ability_youri_speed_activate` returns error if player has < 20 MP on Youri's slot | VERIFIED | `mosjeAbilities.js` line 461–463; test `blocks when Youri slot has < 20 MP` passes |
| 2 | Returns error if no face-down piecie exists on field | VERIFIED | `mosjeAbilities.js` line 469–471; test `blocks when no face-down piecies on field` passes |
| 3 | Returns error if `youriAbilityUses` is already 3 | VERIFIED | `mosjeAbilities.js` line 450–452; test `blocks when youriAbilityUses >= 3` passes |
| 4 | On success, Youri slot MP reduced by 20 and `youriAbilityUses` incremented | VERIFIED | `mosjeAbilities.js` lines 474–475; test asserts `mp === 30` (from 50) and `youriAbilityUses === 1` |
| 5 | Single face-down piecie: `canActivateOnTurn` set to `state.turnNumber`, 1 card drawn | VERIFIED | `mosjeAbilities.js` lines 477–484; test `auto-activates single face-down piecie` passes |
| 6 | Multiple face-down piecies: state returns `pendingYouriActivation: true` without drawing | VERIFIED | `mosjeAbilities.js` lines 485–490; test `returns pendingYouriActivation: true` passes |
| 7 | `instantPiecieThisTurn` flag removed from Youri's ability entirely | VERIFIED | No `instantPiecieThisTurn` anywhere in `ability_youri_speed_activate`; grep confirms absence |
| 8 | `youriAbilityUses: 0` initialised in `createPlayerState` | VERIFIED | `gameState.js` line 97 — `youriAbilityUses: 0, // Youri Speed Activate — blocked at 3 per game` |
| 9 | `handleUseAbility` routes `mosje_youri` to new Youri handler block | VERIFIED | `main.js` lines 1233 + 1646 — `YOURI_SPEED_ACTIVATE_IDS` set defined, checked with `.has(mosjeId)` |
| 10 | Multi-piecie path: slot picker modal, activatePiecie called, 1 card drawn | VERIFIED (wired) | `main.js` lines 1656–1701 — `showOptionSelect`, `activatePiecie`, hand push all present; human smoke test needed |
| 11 | Single-piecie auto-path: engine-unlocked slot found, `activatePiecie` called | VERIFIED (wired) | `main.js` lines 1702–1716 — `findIndex` for `canActivateOnTurn === turnNumber`, `activatePiecie` called |
| 12 | Chris+Youri synergy: both on field → `canActivateOnTurn === turnNumber` in `playPiecie` | VERIFIED | `turnManager.js` line 449–459; 4 synergy tests pass (mosje_chris, mosje_chris_ddr, negative cases, defeated case) |
| 13 | `hasBothChrisAndYouri` helper exists, checks for defeated slots correctly | VERIFIED | `turnManager.js` lines 22–30; `isDefeated` guard present; test for defeated-Chris returns `turnNumber+1` |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/gameState.js` | `youriAbilityUses: 0` in `createPlayerState` | VERIFIED | Line 97 — field present with correct comment |
| `src/abilities/mosjeAbilities.js` | Rewritten `ability_youri_speed_activate` with correct logic | VERIFIED | Lines 443–491 — all preconditions, deduction, single/multi paths, no `instantPiecieThisTurn` |
| `src/main.js` | Youri ability UI handler inside `handleUseAbility` | VERIFIED | `YOURI_SPEED_ACTIVATE_IDS` at line 1233; full handler at lines 1646–1723 |
| `src/engine/turnManager.js` | `hasBothChrisAndYouri` helper + `playPiecie` synergy check | VERIFIED | Helper at lines 22–30; synergy check at lines 449–460 |
| `tests/abilities/youri-chris-synergy.test.ts` | 10 tests covering all ability and synergy cases | VERIFIED | File exists; all 10 tests pass (confirmed by `npm test` output) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `mosjeAbilities.js ability_youri_speed_activate` | `gameState.js player.youriAbilityUses` | `player.youriAbilityUses` read and written | WIRED | Lines 450, 475 read/write the counter |
| `main.js handleUseAbility — Youri block` | `mosjeAbilities.js ability_youri_speed_activate` | `useMosjeAbility` dispatches to ability | WIRED | `useMosjeAbility(gameState, localPlayerId, mosjeId)` at line 1647–1648; `pendingYouriActivation` destructured |
| `main.js Youri block` | `turnManager.js activatePiecie` | `activatePiecie(stateAfterAbility, localPlayerId, slotIndex)` | WIRED | Lines 1686–1691 (multi-path) and 1711–1714 (single-path) |
| `turnManager.js playPiecie` | `player.activeSlots` | inline `hasBothChrisAndYouri(player)` call | WIRED | Line 449 — helper called before slot creation |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `mosjeAbilities.js` | `youriSlot.mp`, `faceDownIndices`, `player.youriAbilityUses` | `state.players[playerId]` (engine state) | Yes — reads from live game state, not hardcoded | FLOWING |
| `turnManager.js playPiecie` | `chrisYouriSynergy` | `player.activeSlots` (engine state) | Yes — reads live slot array with defeat checks | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `ability_youri_speed_activate` all 5 engine test cases | `npm test` — `tests/abilities/youri-chris-synergy.test.ts` | 5/5 ability tests pass | PASS |
| Chris+Youri synergy all 5 cases | `npm test` — `tests/abilities/youri-chris-synergy.test.ts` | 5/5 synergy tests pass | PASS |
| `node --check` on all UI files | `node --check src/main.js ...` | No output (clean) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| YCS-01 | 27-01, 27-02 | Youri Speed Activate: 20 MP cost, activate face-down piecie, draw 1 card | SATISFIED | Engine function fully implemented; main.js handler wired; tests pass |
| YCS-02 | 27-01 | Youri 3-use cap per game | SATISFIED | `youriAbilityUses` counter in `gameState.js`; cap check in ability; test passes |
| YCS-03 | 27-03 | Chris+Youri passive synergy: both on field → piecies activatable same turn | SATISFIED | `hasBothChrisAndYouri` + `playPiecie` change; 5 synergy tests pass |

---

### Anti-Patterns Found

No blockers or warnings. The old `instantPiecieThisTurn` flag is gone from the Youri ability. One pre-existing unrelated test failure exists in `tests/bot/offlineGame.smoke.test.ts` (crash in `useMosjeAbility` at `turnManager.js:1031` — `state.players[player_2]` undefined — confirmed pre-existing by both 27-02 and 27-03 summaries; not introduced by this phase).

---

### Human Verification Required

#### 1. Youri ability — single piecie auto-path (browser)

**Test:** In `game.html`, play Youri into an active slot. Play exactly one Piecie card face-down. Then use Youri's ability.
**Expected:** No slot-picker modal. The face-down piecie activates immediately. Hand grows by 1. Youri MP drops by 20.
**Why human:** The single-piecie path calls `activatePiecie` inside an `async` handler after the engine sets `canActivateOnTurn`. The full modal and render pipeline requires the browser.

#### 2. Youri ability — multi-piecie slot picker (browser)

**Test:** Play two or more face-down Piecies, then use Youri's ability.
**Expected:** A `showOptionSelect` modal appears listing each slot with its piecie name. Selecting one activates that piecie and draws 1 card. Youri MP drops by 20.
**Why human:** `modal.showOptionSelect` is an async browser modal; cannot verify rendering without a live game session.

#### 3. Cancel path — cost irrevocable

**Test:** Open the slot-picker (2+ face-down piecies) and dismiss/cancel it without selecting.
**Expected:** Info modal: "Youri paid 20 MP but no Piecie was selected. The cost is still spent." Youri MP remains reduced. No piecie activates.
**Why human:** Modal dismiss behaviour depends on browser-level cancel flow.

#### 4. 3-use cap player-visible error

**Test:** Use Youri's ability 3 times, then attempt a 4th.
**Expected:** "Cannot Use Ability — Youri Speed Activate has already been used 3 times this game" shown in info modal. No MP deducted on 4th attempt.
**Why human:** Requires a full multi-turn play session to exhaust the counter.

---

### Gaps Summary

No gaps. All 13 must-have truths are verified in the codebase. All three requirements (YCS-01, YCS-02, YCS-03) are satisfied. The phase is blocked only by 4 browser-level smoke tests that require a human to run `game.html`.

---

_Verified: 2026-06-05T23:16:00Z_
_Verifier: Claude (gsd-verifier)_
