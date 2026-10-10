---
phase: 53-2-0-card-data-and-example-decks
verified: 2026-10-11T00:00:00Z
status: passed
score: 4/4 roadmap success criteria verified (7/7 requirements)
overrides_applied: 0
---

# Phase 53: 2.0 Card Data and Example Decks - Verification Report

**Goal:** The game's card data is the 2.0 Card List, and the 3 Example Decks can be loaded from it.
**Status:** passed. Initial verification.

## Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 183 cards present with ids kept; `quest_dutch_courage` and `quest_cheat_code` exist | VERIFIED | Runtime import: MOSJES 35, QUESTS 48, PIECIES 74, SNELLE 20, PLACES 21 (198 total). The extras are the disabled/hidden cards, so the visible counts are 32/38/73/20/20. Both new quests exist. E29 bijection tests pass. |
| 2 | 2.0 fields on all card types | VERIFIED | Mosje has `startMP`, `levels[3]` (power + traits), and ability/synergy text. Piecie has `tag`, `stays`, `levelGate`, `limitPerDeck`, `givesMP`. Place has `cost`, `goodFor`, `badFor` and `limitPerDeck` 2. Quest has `text`. E28 tag tests pass. |
| 3 | Parked/cut cards, Personal Quests, duo decks and old starter decks hidden (data kept) and excluded from decks, boosters, the bot and the deck builder; Drain Zone and The Void playable | VERIFIED | 15 cards carry `disabled` (data still in `src/data/`). The 8 old starter decks carry `hidden`. The `!c.disabled` filter is in `boosterEngine.js` and `cardIndex.js`, and `pickBotDeck.js` picks Example Decks only. Drain Zone and The Void have no flags and cost 3. |
| 4 | Each Example Deck loads as 30 cards, max 2 copies, ★★★★★ max 1, starting Mosje inside | VERIFIED | Independent script: all three decks have 30 cards, no id above 2 copies, no missing ids, and the starting Mosje is included. The only 5-star cards are `piecie_harde_didde` (Taksen) and `piecie_klaar_met_jou` (Regelaars), one each. No disabled or Personal Quest cards are in any deck. |

## Requirements Coverage

All IDs from the PLAN frontmatter (DATA-01 to DATA-07) are marked Complete in REQUIREMENTS.md and mapped to Phase 53. No orphaned requirements.

| Req | Plans | Status |
|-----|-------|--------|
| DATA-01 | 01-05 | SATISFIED |
| DATA-02 | 02, 03 | SATISFIED |
| DATA-03 | 04 | SATISFIED |
| DATA-04 | 01, 05 | SATISFIED |
| DATA-05 | 05 | SATISFIED |
| DATA-06 | 06, 07 | SATISFIED |
| DATA-07 | 01, 07 | SATISFIED |

## Behavioral Checks

| Check | Result |
|-------|--------|
| `npm test` | PASS: 93 files, 968 tests |
| `node --check` list from CLAUDE.md | PASS: clean |
| Runtime data script (counts, decks, flags) | PASS, as above |
| `npm run test:sim` | NOT RUN, per instruction. A known documented deviation: the sim specs are re-pointed in Phase 64. No evidence the Example Decks crash the engine; `buildDeck` is exercised in E30. |

## Anti-Patterns

No TBD, FIXME or XXX markers found in the files `src` changed in the recent phase commits.

## Human Verification

None required for this data phase.

## Notes

- Quest `rarity` stays at the V4 value, as documented in the ROADMAP quest rarity note.
- The unmet sim gate is documented and deferred to Phase 64. It is not a Phase 53 gap.

_Verifier: Claude (gsd-verifier)_
