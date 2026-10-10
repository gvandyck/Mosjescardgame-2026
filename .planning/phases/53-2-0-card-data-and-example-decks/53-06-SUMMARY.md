---
phase: 53-2-0-card-data-and-example-decks
plan: 06
subsystem: data
tags: [obby-2.0, card-data, hidden-cards]
requires: [53-05]
provides:
  - 15 parked/cut cards hidden via the existing `disabled: true` flag (data kept)
  - mosje_drainer visible again
  - E29 umbrella test: visible cards == the 183 Card List cards
affects: [53-07]
key-files:
  created:
    - scripts/obby2/hiddenCardIds.mjs
    - scripts/obby2/applyHiddenFlags.mjs
    - tests/data/card-list-2-0.test.ts
  modified:
    - src/data/mosjes.js
    - src/data/piecies.js
    - src/data/places.js
    - src/data/quests.js
    - src/data/boosterEngine.js
    - tests/data/hidden-cards.test.ts
    - tests/data/player-facing-places.test.ts
key-decisions:
  - "The CONTEXT 'hidden flag' is implemented as the existing `disabled: true` flag (one flag, 4 filter points)"
  - "The 4 cut General Quests stay in the V4 shared Quest pile (engine does not filter disabled) until Phases 55/56 build the 3 typed stacks"
requirements-completed: [DATA-01]
duration: 20min
completed: 2026-10-10
---

# Phase 53 Plan 06: Hide parked/cut cards Summary

15 cards (3 Mosjes, 1 Piecie, 1 Place, 4 cut Quests, West Perfect Read, 5 Personal Quests) now carry `disabled: true` with data kept; Drainer is visible. The E29 umbrella test proves the visible set equals the 183 Card List cards exactly.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Hide list, flags, un-hide Drainer | b7ec387 | `HIDDEN_CARD_IDS` (15), idempotent `applyHiddenFlags.mjs` (second run: changed 0) |
| 2. E29 umbrella and hidden-cards rewrite | f201b6b | 183 rows, bijection, cost/rarity/limitPerDeck checks, drawPack(1000), starter-eligible, player-facing Places, static deck-builder guard |

Tests were written first and confirmed red (25 failures) before the data changed, then green.

## Deviations from Plan

- [Rule 1] My first script version inserted the flag at the first nested `}` (inside `roll: {...}`) and corrupted Mosje blocks; I reverted the data files and fixed it to match the card's closing brace by indent. The final diff is flag-only.
- 53-05's "at least 20 Places" assertion tightened: raw `PLACES.length` is exactly 21 (Momentum Factory kept in data) and non-disabled Places are exactly 20. A raw length of 20 is impossible while the data is kept.
- Only `boosterEngine.js`'s comment changed (no logic). The 5 `quest_personal_*` ids were confirmed to be all that exist in quests.js.

## Gaps / notes

- Engine untouched. `gameState.js` still builds the Quest pile from all QUESTS, so the 4 cut General Quests, West Perfect Read and the Personal Quests remain reachable in-game until Phases 55/56 (accepted, T-53-14).
- `src/deck-builder.js` filtering is checked by source text only (module needs Firebase).
- DATA-06 stays pending (hidden decks in 53-07).

## Verification

`node --check` list clean; `npm test` 92 files / 950 tests pass (card-editor round-trip included); `git diff` on src/engine, src/abilities, src/bot is empty. DATA-01 ticked.

## Known Stubs

None.

## Self-Check: PASSED
