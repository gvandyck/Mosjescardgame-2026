---
phase: 53-2-0-card-data-and-example-decks
plan: 01
subsystem: data
tags: [obby-2.0, card-data, parser, vitest]
requires: []
provides:
  - scripts/obby2 shared parsers (Card List, Example Decks)
  - CARD_ID_MAP (183 names -> ids)
  - QUEST_BANDS, getFrameTier, getCopyLimit
affects: [53-02, 53-03, 53-04, 53-05, 53-06, 53-07]
tech-stack:
  added: []
  patterns: [dev-only .mjs parsers re-reading docs in tests, one exported function per file]
key-files:
  created:
    - scripts/obby2/readDoc.mjs
    - scripts/obby2/splitMarkdownBlocks.mjs
    - scripts/obby2/parseMarkdownTable.mjs
    - scripts/obby2/parseLevelCell.mjs
    - scripts/obby2/parseWinLose.mjs
    - scripts/obby2/parseCardList.mjs
    - scripts/obby2/parseExampleDecks.mjs
    - scripts/obby2/cardIdMap.mjs
    - src/data/questBands.js
    - src/data/getFrameTier.js
    - src/data/getCopyLimit.js
    - tests/data/card-list-parser.test.ts
    - tests/data/obby2-data-helpers.test.ts
  modified: []
key-decisions:
  - "Added splitMarkdownBlocks.mjs (not in plan file list) so parseCardList stays small; it is dev-only"
  - "Parsed piecie row 'tag' is the Kind suffix (food/pet/substance/gear) or null; 'group' only mp/attack/utility"
requirements-completed: [DATA-01, DATA-04, DATA-07]
duration: 15min
completed: 2026-10-10
---

# Phase 53 Plan 01: Shared parsers, id map and data helpers Summary

Dev-only parsers turn the 2.0 Card List into 183 rows (32/38/73/20/20) and the Example Decks into 3 decks of 30. A 183-entry name-to-id map, `QUEST_BANDS`, `getFrameTier` and `getCopyLimit` are added. No card data files changed.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Parsers | 5f4b014 | parseCardList, parseExampleDecks and helpers; 10 parser tests |
| 2. Id map and helpers | e317fbe | CARD_ID_MAP, QUEST_BANDS, getFrameTier, getCopyLimit; tests |

## Verification

- `npm test`: 85 files, 830 tests passed.
- `node --check` clean on the three new `src/data` files.
- Nothing in `src/` imports `scripts/obby2`; `src/ui` does not use `getFrameTier`; `deck-builder.js` untouched.
- Only `quest_dutch_courage` and `quest_cheat_code` are missing from `ALL_CARDS`. The test asserts this exact list, so plan 53-05 must update it to "all exist".

## Deviations from Plan

None - plan executed as written, apart from the extra `splitMarkdownBlocks.mjs` helper noted above.

## Known Stubs

None.

## Self-Check: PASSED
