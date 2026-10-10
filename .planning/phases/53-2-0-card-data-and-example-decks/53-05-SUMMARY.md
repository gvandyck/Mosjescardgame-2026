---
phase: 53-2-0-card-data-and-example-decks
plan: 05
subsystem: data
tags: [obby-2.0, card-data, quests, places]
requires: [53-04]
provides:
  - 38 Quests (incl. new quest_dutch_courage, quest_cheat_code) and 20 Places carrying Card List 2.0 data
  - Drain Zone and The Void unhidden
  - E29 Quest and Place tests
affects: [53-06]
key-files:
  created:
    - scripts/obby2/questCostIds.mjs
    - scripts/obby2/newQuestBlocks.mjs
    - scripts/obby2/addNewQuests.mjs
    - scripts/obby2/composeQuestText.mjs
    - scripts/obby2/buildQuestsFields.mjs
    - scripts/obby2/buildPlacesFields.mjs
    - tests/data/card-list-2-0-quests.test.ts
    - tests/data/card-list-2-0-places.test.ts
  modified:
    - scripts/obby2/toJsLiteral.mjs
    - src/data/quests.js
    - src/data/places.js
    - src/data/playerFacingPlaces.js
    - tests/data/card-list-parser.test.ts
    - tests/data/player-facing-places.test.ts
key-decisions:
  - "Quest 2.0 text lives in new `text` field (composed from the Card List row) plus band/rollTrait/costText/costId/win/lose/extras; V4 description, roll, successMP, failMP, requirementDescription, rarity, difficulty kept"
  - "Quests have no rarity in the 2.0 Card List; V4 Quest rarity left unchanged. Per Phase 7 A7 Quests use tier 1 boxed frame (getFrameTier returns it for every Quest)"
  - "Place goodFor/badFor stay string arrays; limitPerDeck 1 for 5-star else 2"
requirements-completed: [DATA-04, DATA-05]
duration: 25min
completed: 2026-10-10
---

# Phase 53 Plan 05: Quests and Places on Card List 2.0 Summary

All 38 Quests and 20 Places now carry Card List 2.0 data beside the V4 fields. Generator output: `patched 38` and `patched 20`, no missing ids, second runs produce no diff. Stacks are FIGHTING 13 / DIGITAL 13 / ARTISTIC 12, and every Quest's win/lose equals its QUEST_BANDS row.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Quests | 31a4926 | 2 new quest blocks (V4-compatible, so deck-balance and phase-22 guards pass), builder, 21 costIds, E29 Quest test; parser test now asserts all 183 ids exist |
| 2. Places | a23a0c8 | builder, E29 Place test, `getPlayerFacingPlaces()` filters only on `disabled`; Drain Zone and The Void returned |

## Deviations from Plan

- [Rule 3] `toJsLiteral.mjs` rejected numeric object keys (quest `thresholds: {1:..}`); it now accepts integer keys.
- TDD order: the Quest and Place tests were written before applying, but I ran the generators before first running them, so no separate red run was observed.
- `player-facing-places.test.ts` asserts `PLACES.length >= 20` rather than 20: raw PLACES also holds V4-only Momentum Factory (21), which plan 53-06 hides.
- Test edits: `player-facing-places.test.ts` rewritten (Drain Zone and The Void are now present; list equals `PLACES.filter(!disabled)`), `card-list-parser.test.ts` ("all 183 exist"). No other test needed changing.

## Gaps for later phases

- The two new Quests carry V4 numbers (+55/-15, +60/-20) and V4 `requirementId`s (`quest_req_dutch_courage`, `quest_req_cheat_code`) with no matching entries in questLogic; 2.0 win/lose live in `win`/`lose`. Engine wiring of band rules, costs (`costId`) and extras belongs to Phases 56-60.
- Place `cost` (Energy) is data only; V4 engine does not charge it yet.
- Drain Zone and The Void are now selectable in decks/boosters but still carry V4 effect wiring; their 2.0 text may disagree with the engine (Phase 35 descoped them for that reason). Needs checking in Phases 58-60.
- Open 53-04 rules questions (4 TODOs for Phase 59) unchanged.

## Verification

- `node --check` list clean; `npm test`: 91 files pass (card-editor round-trip included).
- `git diff` on src/engine, src/abilities, src/bot: empty.
- DATA-04 and DATA-05 ticked. DATA-01 left pending (finishes in 53-06).

## Known Stubs

None.

## Self-Check: PASSED
