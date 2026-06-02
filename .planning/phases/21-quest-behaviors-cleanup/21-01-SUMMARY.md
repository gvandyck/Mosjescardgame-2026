---
phase: 21-quest-behaviors-cleanup
plan: 01
subsystem: engine
tags: [quests, resolveQuest, draw-on-success, elimination, hacker-threshold, dead-code, vitest, tdd]

# Dependency graph
requires:
  - phase: 17-place-rework
    provides: Huisbaas reworked to return a Place from the owner's discard (doc status corrected here)
  - phase: 18-dead-flag-mosjes
    provides: dead-flag Mosje ability fixes (same _pendingTargets selection pattern referenced by the RED test scaffolding)
provides:
  - "resolveQuest consumes a quest-def drawOnSuccess field: draws N from the questing player's deck to hand on success (deck-size capped)"
  - "resolveQuest consumes a quest-def opponentLoseMP field: drains an opponent's first active Mosje via loseMP on success, skipped under The Void"
  - "quest_req_hack_mainframe FPS/Hacker -1 threshold now fires (reads cardId instead of the always-undefined mosjeId)"
  - "Artistic Expression + Late Night Questing carry drawOnSuccess:2; Elimination Challenge carries opponentLoseMP:30"
  - "dead effect_jensen / effect_lucky_coin stubs removed; card-reference.md statuses corrected"
affects: [quest-behaviors, ui-quest-resolution, card-reference]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quest side-effects driven by static data fields on the quest def, consumed by resolveQuest (no signature/caller change)"
    - "Side-effects placed AFTER the MP block read state.players[playerId] freshly (gainMP/loseMP reassign `state`, making the early local `player` ref stale)"

key-files:
  created:
    - tests/abilities/quest-behaviors.test.ts
  modified:
    - src/abilities/questLogic.js
    - src/data/quests.js
    - src/abilities/snelleEffects.js
    - tests/cards/test-snelleEffects.js
    - docs/card-reference.md

key-decisions:
  - "Drove draw-on-success / elimination off static quest-def fields (drawOnSuccess / opponentLoseMP) rather than the per-roll drawExtra/isElimination return flags — resolveQuest already holds questCard, so no signature or caller change"
  - "Referenced fresh state.players[playerId] for the new blocks (the #1 correctness trap: gainMP/loseMP reassign `state`, so the line ~231 `player` is stale after the MP block)"
  - "Routed the -30 MP through loseMP (not a raw mp -=) so MP_LOSS_REDUCTION / drain reasons apply consistently"
  - "Kept tests/cards/test-snelleEffects.js (it has many live-effect tests); removed only the two dead-stub blocks"
  - "Did NOT touch FPS West / Ronald Chef (STUB-16) doc status — their blockers are genuine UI primitives, out of this engine phase's scope and unverified against code"

patterns-established:
  - "Quest data field → resolveQuest consumption: a clean way to wire pure-state quest side-effects without a UI hook"

requirements-completed: [QUEST-01, QUEST-02, QUEST-03, CLEAN-01]

# Metrics
duration: 13min
completed: 2026-06-03
---

# Phase 21 Plan 01: Quest Behaviors + Dead-Code Cleanup Summary

**Wired 3 engine-doable quest behaviors (draw-on-success, Elimination Challenge opponent -30 MP, Hack Mainframe FPS threshold) off static quest-def fields, and deleted the dead Jensen/Lucky Coin stubs + corrected stale card-reference rows.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-06-02T23:00:31Z (RED commit 01:03:14 +0200)
- **Completed:** 2026-06-03T01:13:37+0200
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- `resolveQuest` now draws `questCard.drawOnSuccess` cards from the questing player's deck into hand on success (capped at deck size; nothing on failure or empty deck) — drives Artistic Expression + Late Night Questing.
- `resolveQuest` now applies `questCard.opponentLoseMP` as a `loseMP` on the opponent's first active Mosje on success, skipped under The Void — drives Elimination Challenge.
- `quest_req_hack_mainframe` reads `mosje.cardId` (was the always-undefined `mosjeId`), so FPS/Hacker Mosjes finally get the -1 threshold.
- Deleted unused `effect_jensen` / `effect_lucky_coin` stubs (no card references them); removed their stub blocks from the unrun `.js` test file; corrected stale `card-reference.md` statuses (Huisbaas, Geen Raad, the 4 quests this phase wired) and removed the now-stale STUB-13 footnote.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — failing tests** - `dc70496` (test)
2. **Task 2: GREEN — wire the 3 behaviors** - `44a74ee` (feat)
3. **Task 3: cleanup — delete stubs + refresh docs** - `6a93f4c` (chore)

**Plan metadata:** (this SUMMARY) - `docs(21-01): summary`

_Note: this is a `type: tdd` plan — RED (`test`) then GREEN (`feat`); no separate refactor commit was needed._

## Files Created/Modified
- `tests/abilities/quest-behaviors.test.ts` - 11 vitest cases: draw-on-success (success/failure/empty-deck), opponentLoseMP (success/failure/The-Void), hack_mainframe FPS bonus (FPS vs non-FPS cardId), and real-def field assertions.
- `src/abilities/questLogic.js` - drawOnSuccess + opponentLoseMP blocks inserted between the MP block and `applyMosjeFieldEffectsOnQuest` (fresh `state.players[playerId]`); `quest_req_hack_mainframe` id fix; stale DEFERRED comments on the 3 `quest_req_*` functions updated to point at the new data fields.
- `src/data/quests.js` - `drawOnSuccess:2` on Artistic Expression + Late Night Questing; `opponentLoseMP:30` on Elimination Challenge; stale DEFERRED comments removed (files stay data-only).
- `src/abilities/snelleEffects.js` - deleted the `effect_jensen` + `effect_lucky_coin` placeholder exports.
- `tests/cards/test-snelleEffects.js` - removed the two dead-stub test blocks (file retained for its live-effect tests; vitest does not run `.js`).
- `docs/card-reference.md` - 6 rows/notes corrected (Huisbaas, Geen Raad, Artistic Expression, Late Night Questing, Elimination Challenge, Hack Mainframe) + STUB-13 footnote removed.

## Decisions Made
- Drove the side-effects off static quest-def fields rather than the per-roll return flags (cleaner — no `resolveQuest` signature or caller change).
- Used fresh `state.players[playerId]` for the new blocks to avoid the stale-`player` trap after `gainMP`/`loseMP` reassign `state`.
- The -30 MP goes through `loseMP` (reason `QUEST_ELIMINATION`), not a raw `mp -=`.
- Left the per-roll `drawExtra:2` / `isElimination:true` returns in place (harmless; data fields supersede them) and only corrected their misleading comments.

## Deviations from Plan

None of consequence. Two minor, in-scope adaptations worth noting:

- **Line numbers shifted after the Task 2 insertion.** The plan's DEFERRED-comment line references (~624/~825/~863 in questLogic.js) moved by ~18 lines once the draw/elimination blocks were inserted. Re-grepped and edited the real locations; the three resolved comments were updated and the genuinely-still-deferred ones (speed-run gate, chain-master per-turn counter, 3-way outcome, card-guess) were left untouched. No behavior impact.
- **Kept `tests/cards/test-snelleEffects.js` rather than deleting it.** The plan allowed deletion "if nothing meaningful remains" — but the file holds many live-effect tests (Snelle Jensen, Emergency Healings, FF Haaltje Nemen, Momentum Rush, Lucky Coin full impl, counter-chain, Jantje Jantje Jantje, Blensen). Removed only the two dead-stub blocks. (Note: this `.js` file is not run by vitest, which only collects `tests/**/*.ts`.)
- **Did NOT mark FPS West / Ronald Chef (STUB-16) implemented.** The plan listed Phase 18-20 doc updates as optional and said to verify against code. Their blockers are genuine UI-reveal primitives (out of this engine phase's scope) and I did not verify them implemented, so per CLAUDE.md ("when in doubt, don't guess") I left their `deferred` status unchanged. Leipe Swap was already marked implemented.

## Issues Encountered
None. RED produced exactly the 6 expected failures (the 3 behaviors + 3 field assertions); GREEN turned all 11 green with no collateral breakage.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The three behaviors are engine-complete and covered. The UI quest-resolution layer can now surface "drew 2" / "opponent -30 MP" from the resolved state (the `[QUEST]` console logs mark each).
- Bucket D (quest 3-way outcomes, first-action / attack-source gates, per-turn Piecie counter, card-guess prompts) remains deferred as genuine UI-layer work — their DEFERRED comments and doc notes were intentionally left in place.

## Verification
- `npm test` → **867 passed** (95 files); baseline was 856 + 11 new.
- `npx tsx src/simulation/run-once.ts` → **0 crashes, 0 timeouts** (100 games).
- `grep effect_jensen|effect_lucky_coin src/` → **0**.
- `grep drawOnSuccess` → questLogic.js 1+, quests.js 2; `grep opponentLoseMP` → questLogic.js 1+, quests.js 1.

## Self-Check: PASSED

- FOUND: tests/abilities/quest-behaviors.test.ts
- FOUND: commit dc70496 (test), 44a74ee (feat), 6a93f4c (chore)
- effect_jensen / effect_lucky_coin in src/ → 0
- MP-touching change: full simulation re-run, 0 crashes; Ronald Kip stacking test (part of `npm test`) green.

---
*Phase: 21-quest-behaviors-cleanup*
*Completed: 2026-06-03*
