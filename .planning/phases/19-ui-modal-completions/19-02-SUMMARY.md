---
phase: 19-ui-modal-completions
plan: 02
subsystem: mosje-abilities
tags: [mosje-ability, ronald-chef, hand-lock, mp, cooldown, turn-manager, modal, vitest]

# Dependency graph
requires:
  - phase: 18-dead-flags
    provides: "_pendingTargets UI->ability handoff pattern (West/Binti); loseMP routing for visible/logged MP changes; startTurn dead-flag hygiene block"
  - phase: 19-ui-modal-completions
    provides: "Plan 01 FPS West block — showOpponentHandCardSelect + Binti post-call flow reused verbatim for the Ronald pick UI"
provides:
  - "Ronald Chef Strategic Insight reworked from a dead deck-peek stub into a hand-card LOCK: pay 20 MP (via loseMP) to pick an opponent hand card; it is unplayable until the locker's next turn. 3-turn cooldown on the slot."
  - "New hand-card-lock mechanic: isHandCardLocked guard in playPiecie/playSnellie/playMosje/playPlace + startTurn cooldown-tick and lock auto-expiry"
  - "main.js handleUseAbility RONALD_CHEF_INSIGHT_IDS pick-and-lock block reusing the FPS-West/Binti modal flow"
affects: [ui-modal-completions, mosje-abilities, additional-cards, multiplayer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-card lock: an ability writes state.players[oppId]._lockedCard = { cardId, byPlayer }; the four play-from-hand functions reject a matching cardId via a shared isHandCardLocked helper; startTurn expires the lock when the locker's turn returns."
    - "Per-slot cooldown (strategicInsightCooldown) set on use and decremented in the startTurn reset block alongside the Phase 18 single-turn flag-clears."
    - "±MP always routed through loseMP (never raw mp -=) so it animates and logs."

key-files:
  created:
    - tests/abilities/ronald-chef-lock.test.ts
  modified:
    - src/abilities/mosjeAbilities.js
    - src/engine/turnManager.js
    - src/main.js
    - src/data/mosjes.js

key-decisions:
  - "Lock guards call the shared isHandCardLocked helper rather than inlining _lockedCard, so _lockedCard appears 3x (not the plan's stated 5x) in turnManager.js — the DRY helper is the design the plan itself specified, and isHandCardLocked appears 5x (1 def + 4 guards). Functional intent fully met; the plan's grep count was internally inconsistent with its own helper instruction."
  - "Lock guards return the function's REAL failure shape { state, success: false, error } using the LOCAL state clone — not the plan's illustrative { state: gameState, ... }. All four play functions clone gameState into a local `state` on line 1 and return that on every early reject; returning the local clone matches every sibling early-return and keeps the contract uniform."
  - "startTurn hygiene uses the real in-scope variable `playerId` (= state.activePlayerId) for the starting player's id, not the plan's placeholder `activePlayerId`."

patterns-established:
  - "Hand-card lock enforced at the play-from-hand boundary via a single shared guard, with lifetime managed by startTurn (set-on-use cooldown + locker-returns expiry)."

requirements-completed: [UICARD-02]

# Metrics
duration: 4 min
completed: 2026-06-02
---

# Phase 19 Plan 02: Ronald Chef Strategic Insight Hand-Lock Summary

**Ronald Chef "Strategic Insight" reworked from a dead deck-peek stub into a hand-card lock — pay 20 MP (via loseMP) to pick an opponent hand card, which becomes unplayable until your next turn; enforced in all four play-from-hand functions with a 3-turn cooldown and automatic lock expiry.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-02T20:09:31+02:00 (RED commit)
- **Completed:** 2026-06-02T20:12:21+02:00 (GREEN commit)
- **Tasks:** 2 (RED, GREEN)
- **Files modified:** 4 (+1 test file created)

## Accomplishments
- Rewrote `ability_ronald_chef_strategic_insight` as a pay-20-MP hand-lock: validates the Ronald slot (matched via `String(cardId).includes('ronald_chef')`), throws on `mp < 20` or an active `strategicInsightCooldown`, charges 20 MP through `loseMP` (`RONALD_INSIGHT` source — visible/logged), sets `state.players[oppId]._lockedCard = { cardId, byPlayer }` from `_pendingTargets.ronaldLockCardId`, sets `strategicInsightCooldown = 3`, and deletes the pending target. All `_ronaldPeek` / `_ronaldPeekPlayerId` / `_ronaldPeekTimestamp` lines removed.
- Introduced the hand-card-lock mechanic in `turnManager.js`: a shared non-exported `isHandCardLocked(gameState, playerId, cardRef)` helper plus a guard at the start of `playPiecie`, `playSnellie`, `playMosje`, and `playPlace`, each returning that function's real `{ state, success: false, error }` shape (local clone). Added cooldown-tick + lock-expiry to the `startTurn` reset block: the starting player's slot cooldowns decrement, and any `_lockedCard` whose `byPlayer` equals the starting player is cleared (lock auto-expires when the locker's turn returns).
- Added `RONALD_CHEF_INSIGHT_IDS` + a pick-and-lock block to `handleUseAbility` in `main.js`, reusing `showOpponentHandCardSelect` (the same face-down picker FPS West / Geen Raad use) and mirroring the Binti post-call structure exactly (success guard → animate → `gameState = newState` → log → `logStateOutcome` → `syncPush` → FINISHED check → `renderAndAnimate`); guards an empty opponent hand with `showInfo`.
- Updated `mosje_ronald_chef.abilityDescription` to the pick-and-lock text and archived the legacy description as an adjacent comment for easy revert.

## Task Commits

Each task was committed atomically (TDD: test → feat):

1. **Task 1: RED — failing tests for charge+lock+cooldown, play guard, startTurn hygiene** - `381fbfd` (test)
2. **Task 2: GREEN — ability + lock enforcement + startTurn hygiene + main.js block + description** - `3c5f9e0` (feat)

**Plan metadata:** see the `docs(19-02)` commit for this SUMMARY.

_Note: per-task atomic commits; gate sequence test → feat verified in git log._

## Files Created/Modified
- `tests/abilities/ronald-chef-lock.test.ts` - 8 tests: charges 20 MP + sets opponent `_lockedCard`; throws on MP<20; throws on active cooldown; sets cooldown=3; no `_ronaldPeek`; `playPiecie` rejects a locked card (and leaves it in hand); `startTurn` ticks cooldown 3→2 AND clears the locker's lock; description contains 'lock'/'20 MP'/'pick a card in your opponent's hand' and drops 'predict'/'deck'/'view opponent hand'. Uses `createEngineState` (the startTurn-safe full engine-state builder).
- `src/abilities/mosjeAbilities.js` - `ability_ronald_chef_strategic_insight` replaced with the lock version; `_ronaldPeek*` removed (`gainMP`/`loseMP`/`getOpponentId`/`cloneState` already imported).
- `src/engine/turnManager.js` - `isHandCardLocked` helper + guard in the 4 play functions; `startTurn` cooldown-tick + lock-expiry.
- `src/main.js` - `RONALD_CHEF_INSIGHT_IDS` set + pick-and-lock block in `handleUseAbility`.
- `src/data/mosjes.js` - new `abilityDescription` for `mosje_ronald_chef`; legacy text preserved as a comment.

## Decisions Made
- **Strengthened the description test to make it genuinely RED.** The plan's `<behavior>` for the description only required `contains 'lock'` + `'20 MP'` and `not 'predict'/'deck'` — but the LEGACY text (`"...Pay 20 MP to view opponent hand and lock 1 chosen card..."`) already satisfied all four, so that assertion passed during RED before any change (a TDD fail-fast red flag). The real rework replaces **"view opponent hand"** (the dead peek) with **"pick a card in your opponent's hand"**. I added `expect(desc).toContain("pick a card in your opponent's hand")` and `expect(desc).not.toContain("view opponent hand")` so the test fails against the legacy text and pins the actual rewrite. (See Deviations.)
- **Lock guards return the local `state` clone, not `gameState`.** All four play functions clone `gameState` into `let state = JSON.parse(JSON.stringify(gameState))` on their first line and return `{ state, success: false, error }` on every early reject. I matched that exact shape rather than the plan's illustrative `{ state: gameState, ... }`, keeping the guard consistent with each function's sibling early-returns. (See Deviations.)
- **startTurn uses `playerId`** (the real `const playerId = state.activePlayerId` in scope) for the starting player's id, as the plan anticipated ("use whatever variable startTurn already computes").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's description assertion passed against the legacy text (not RED)**
- **Found during:** Task 1 (RED test authoring)
- **Issue:** The plan's description checks (`'lock'`, `'20 MP'`, not `'predict'`, not `'deck'`) were all already true of the legacy `abilityDescription` ("Pay 20 MP to view opponent hand and lock 1 chosen card..."). The description test therefore passed during RED before any code change — it could not drive the required rewrite, violating the TDD gate.
- **Fix:** Added two assertions reflecting the actual rework — the new text must `contain "pick a card in your opponent's hand"` and must NOT contain `"view opponent hand"` (the dead deck-peek phrasing). The test then failed RED and pins the real description change.
- **Files modified:** tests/abilities/ronald-chef-lock.test.ts
- **Verification:** RED — all 8 new tests failed (842 others still passed). GREEN — all 8 passed.
- **Committed in:** 381fbfd (RED), confirmed green by 3c5f9e0 (GREEN)

### Adaptations (matched real code over plan's illustrative snippets)

**2. [Plan-vs-code] Lock-guard return shape uses the local `state` clone**
- **Found during:** Task 2 (reading the 4 play functions' real failure returns, per the plan's explicit instruction)
- **Detail:** `playPiecie`/`playSnellie`/`playMosje`/`playPlace` all do `let state = JSON.parse(JSON.stringify(gameState))` first and return `{ state, success: false, error }` (the local clone) on every reject. The plan's example guard used `{ state: gameState, ... }`. I used `{ state, success: false, error: '...locked by Ronald Strategic Insight...' }` to match each function's true contract. No behavioural difference for callers, but consistent with the codebase.

**3. [Plan-vs-code] `_lockedCard` grep count is 3 in turnManager.js, not the plan's stated 5+**
- **Found during:** Task 2 (verification greps)
- **Detail:** The plan's verification said `grep -c "_lockedCard" src/engine/turnManager.js → 5+ (helper + 4 guards + startTurn)`. Because the plan ALSO specified a reusable `isHandCardLocked` helper that the guards call **by name**, the literal `_lockedCard` only appears in the helper body (1) and the two startTurn lock-expiry lines (2) = 3; the four guards say `isHandCardLocked(...)`. The "5+" assumed the guards inlined `_lockedCard`, which contradicts the helper design. The meaningful invariant — `isHandCardLocked` defined once + called in all 4 play functions = **5 occurrences** — holds, and aligns with CLAUDE.md's "build once, reuse" rule. Not a defect; the helper-based design is intended and fully wired.

---

**Total deviations:** 1 auto-fixed (1 bug — RED-integrity of the description test) + 2 plan-vs-code adaptations (guard return shape, grep-count expectation). No source-behaviour deviation from the plan's `<interfaces>`; no scope change.
**Impact on plan:** Implementation matches the plan's `<interfaces>` verbatim except where the real code dictated a more accurate shape (guard return) and where the plan's own helper instruction made its grep count unreachable.

## Issues Encountered
- The repo has two distinct turn-manager modules: `src/engine/turn-manager.js` (hyphenated, TS-typed, array-based players, `currentPlayerId`) and `src/engine/turnManager.js` (camelCase, the live engine, object-keyed players, `activePlayerId`). The plan targets the **camelCase** one. The new test imports `startTurn`/`playPiecie` from `turnManager.js` and uses `createEngineState` (the camelCase engine's startTurn-safe builder) to avoid the wrong shape. No code change needed — just import discipline.

## User Setup Required
None - no external service configuration required.

## Verification
1. `npm test` — **850 passed** (842 pre-existing incl. Plan 01 + 8 new), 93 files. ✓ (≥842)
2. `grep -c "_lockedCard"` → turnManager.js **3** (helper + 2 startTurn lines; guards use the named helper), mosjeAbilities.js **1**. `isHandCardLocked` → **5** (1 def + 4 guards: playPiecie/playSnellie/playMosje/playPlace). ✓ (mechanism fully wired; see Deviation 3 re: the plan's 5+ figure)
3. `grep -c "strategicInsightCooldown"` → mosjeAbilities.js **3**, turnManager.js **2**. ✓ (both ≥1)
4. `grep -c "_ronaldPeek" src/abilities/mosjeAbilities.js` → **0** (fully removed). ✓
5. `grep "pick a card in your opponent" src/data/mosjes.js` → present. ✓
6. `grep -c "ronaldLockCardId" src/main.js` → **1**. ✓
7. Simulation (`npx tsx src/simulation/run-once.ts`) — 100 games, **0 crashes, 0 timeouts** (knockout most common; kannetje-melk most-played — confirms the four new play-path guards do NOT break normal plays when no lock is set). ✓
8. MP-change due diligence (CLAUDE.md): full suite includes the Ronald Kip stacking test (`tests/cards/phase4a-step2-food-synergy.test.ts`) — green. ✓

## Next Phase Readiness
- Ronald Chef is now a fully playable hand-lock ability in the UI. The hand-card-lock primitive (`_lockedCard` + `isHandCardLocked`) is reusable by any future "deny a card" effect.
- Known limitation (documented, not a bug): the lock matches by `cardId`, so if the opponent holds duplicates of the locked card, the lock blocks the first copy they try to play. Acceptable for v1.
- Ready for the next Phase 19/20 plan (Leipe Swap MP-swap). No blockers.

## Self-Check: PASSED
- `tests/abilities/ronald-chef-lock.test.ts` — FOUND
- `.planning/phases/19-ui-modal-completions/19-02-SUMMARY.md` — FOUND
- RED commit `381fbfd` — FOUND
- GREEN commit `3c5f9e0` — FOUND

---
*Phase: 19-ui-modal-completions*
*Completed: 2026-06-02*
