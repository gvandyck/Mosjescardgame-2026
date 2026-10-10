---
phase: 53-2-0-card-data-and-example-decks
plan: 02
subsystem: data
tags: [obby-2.0, card-data, generator, mosjes]
requires: [53-01]
provides:
  - scripts/obby2/applyCardList.mjs (reusable idempotent text-patch generator, all card types)
  - 32 Mosjes carrying Card List 2.0 data beside the V4 fields
affects: [53-03, 53-04, 53-05, 53-06]
tech-stack:
  added: []
  patterns: [text-patch of data files by id block, insert before artPath, one function per file]
key-files:
  created:
    - scripts/obby2/findCardBlock.mjs
    - scripts/obby2/toJsLiteral.mjs
    - scripts/obby2/setBlockField.mjs
    - scripts/obby2/patchCard.mjs
    - scripts/obby2/foilMosjeIds.mjs
    - scripts/obby2/applyCardList.mjs
    - scripts/obby2/mosjeSynergyLabels.mjs
    - scripts/obby2/buildMosjesFields.mjs
    - tests/data/obby2-patch-card.test.ts
    - tests/data/card-list-2-0-mosjes.test.ts
  modified:
    - src/data/mosjes.js
key-decisions:
  - "V4 fields (traits, abilityId, synergyWith, petSynergy, tags, artPath, disabled, isBoosterOnly) left untouched; engine still reads them"
  - "Field-name mapping: Card List abilityText -> abilityDescription, synergyText -> synergyEffect, frameTier -> getFrameTier helper (no stored field)"
requirements-completed: []
duration: 20min
completed: 2026-10-10
---

# Phase 53 Plan 02: Mosje data via text-patch generator Summary

An idempotent, line-ending-safe generator patches the 32 Card List Mosjes in `src/data/mosjes.js` with 2.0 names, cost, rarity, startMP, texts, `levels`, `abilityName`, `synergyLabel`, `limitPerDeck` and `foil` (12 Phase-7 Mosjes), keeping every V4 field.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Generator core | bcae636 | findCardBlock, toJsLiteral, setBlockField, patchCard, applyCardList; 5 unit tests |
| 2. Mosje builder + apply + E29 test | a93e51c | `patched 32 / missing []`, second run byte-identical; 5 E29 tests |

## Verification

- Generator run twice: identical diff. `node --check src/data/mosjes.js` clean. 32 `levels: [` entries.
- The 4 targeted vitest files pass (27 tests), including card-editor round-trip. No `rarity:` further than 2500 chars from its `id:`.
- `npm test`: 829 pass, 11 fail. All 11 are V4 old-name/text assertions (below).
- Note: the plan's `grep -c "mpCost\|traits: {"` check is not meaningful, since the new `levels` lines also contain `traits: {` (67 vs 35). V4 `traits` fields confirmed kept; E29 asserts `levels[0].traits` equals `traits`.
- mosjes.js is LF in the working tree (git autocrlf warns); the generator preserves whichever ending it finds.

## Expected V4 failures for 53-03

1. `tests/abilities/ability-text-reconciliation.test.ts` - "Chris All-Rounder ability description > no longer promises a 15 MP gain" (new Card List text contains "15 MP")
2. `tests/abilities/ability-text-reconciliation.test.ts` - "FPS Coert data > abilityDescription already matched the ruling" (expects old phrase "physical or technical quest success")
3. `tests/abilities/fps-west-guess.test.ts` - "contains 'Guess' and '70'..." (new ability is Tactical Analysis text)
4. `tests/abilities/ronald-chef-lock.test.ts` - "describes the lock + 20 MP cost..." (new ability is Strategic Insight text)
5. `tests/data/synergy-text-clarity.test.ts` - "every partner synergy names its partner Mosje(s)": mosje_fps_west text names only FPS Coert, but V4 `synergyWith` still lists AZN Cless
6-11. `tests/ui/card-v1-mosje.test.ts` - 6 tests (full face Alyssa, printed Start MP, no flavour/rarity, MP badge, field tile, art fallback): all look up `[Alyssa] The Bulldozer` by old name (now "Alyssa, The Bulldozer"), giving null/undefined

None is a crash or syntax error.

## Deviations from Plan

None - plan executed as written. (A first heredoc-based file write failed with a shell quoting error before writing anything; files were then created with the Write tool.)

## Known Stubs

None.

## Self-Check: PASSED
