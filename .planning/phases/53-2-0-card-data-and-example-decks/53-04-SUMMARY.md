---
phase: 53-2-0-card-data-and-example-decks
plan: 04
subsystem: data
tags: [obby-2.0, card-data, piecies, snelle, tags]
requires: [53-03]
provides:
  - 73 Piecies and 20 Snelle carrying Card List 2.0 data beside the V4 fields
  - E28 tag-count test and E29 Piecie/Snelle test
affects: [53-05, 53-06]
key-files:
  created:
    - scripts/obby2/staysById.mjs
    - scripts/obby2/givesMpIds.mjs
    - scripts/obby2/buildPieciesFields.mjs
    - scripts/obby2/buildSnelleFields.mjs
    - tests/data/card-tags-2-0.test.ts
    - tests/data/card-list-2-0-piecies-snelle.test.ts
  modified:
    - src/data/piecies.js
    - src/data/snellePiecies.js
    - tests/ui/card-v1-snelle.test.ts
    - tests/ui/card-v1-piecie.test.ts
    - tests/effects/thematic-piecies.test.ts
    - tests/abilities/call-of-welloes.test.ts
    - tests/abilities/interrupt-data-fixes.test.ts
key-decisions:
  - "Field mapping: Card List text -> existing description; new group, costText, cost, tag, stays, levelGate, limitPerDeck, givesMP"
  - "V4 mpCost, requirement, subtype, tags, effectId, isBoosterOnly untouched"
requirements-completed: [DATA-03]
duration: 20min
completed: 2026-10-10
---

# Phase 53 Plan 04: Piecies and Snelle on Card List 2.0 Summary

The generator patched all 73 Piecies and 20 Snelle (`patched 73` / `patched 20`, no missing ids, second run no diff) with 2.0 name, description, rarity, Energy `cost`, `tag`, `group`, `stays`, `levelGate`, `limitPerDeck` and `givesMP`; Blensen! has cost 4 / costText "4 or free". Tags are food 7, pet 5, substance 9, gear 6.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Builders, tables, E28/E29 tests (red first), apply | c4efa6b | 14 `stays` cards, 3 `levelGate: 2`, 31 `givesMP` ids; 14 new tests; card-editor round-trip and mp-cost audit green |
| 2. Rewrite V4 tests | dd30c02 | 9 failures fixed, listed below |

## Field mapping

- 2.0 `text` -> existing `description`
- new `cost` (Energy), `costText` (Snelle, only Blensen!), `group` (Piecies: mp/attack/utility, else null), `tag` (single string or null)
- Renames applied: Nature's Gift (`piecie_eendjes_voeren`), Lucky Cóin (`snelle_lucky_coin`); Place Eendjes Voeren checked by test.

## Test edits (file, assertion, reason)

- `card-v1-snelle.test.ts`: Lucky Coin -> Lucky Cóin (lookups, HTML expectation).
- `card-v1-piecie.test.ts`: Kannetje Melk face text "Gain 25 MP to your active Mosje." -> "One of your Mosjes gains 25 MP." (2.0 text).
- `thematic-piecies.test.ts`: rarities to Card List (loaded_dice ★, perfect_rhythm ★★, dikke_plaat ★). The "not in any starter deck" test still passes (V4 starter decks), so left as is; `isBoosterOnly` unchanged.
- `call-of-welloes.test.ts`: description substrings now from the 2.0 text (Welloe pile summon, Level 1 with starting MP, discard when Mosje leaves).
- `interrupt-data-fixes.test.ts`: Not Today! now asserts "Welloe pile" present, "graveyard" absent.
- `ability-text-reconciliation.test.ts`: needed no change.

## Deviations from Plan

- [Rule 3] `card-v1-piecie.test.ts` was not in the plan file list but failed on the new text; one-string fix.

## Open rules questions for Gandalf (Phase 59)

Each marked `// TODO(phase 59): confirm` in `src/data/piecies.js` (test asserts exactly 4):
1. `givesMP` on MP Amplifier: set false (it only modifies other gains).
2. `givesMP` on Synergy Field: set false (same reason).
3. `stays` on Tikker: set null (Card List does not bold Stays; "leave Tikker face-up next to it").
4. `stays` on MP Hemorrhage: set null (puts card next to the first Mosje it attacks).
Impacts Jeffrey / The Void (givesMP) and Endure Pain's "any Stays card" cost (stays).

## Text/engine gaps for Phases 58-60

No new engine disagreement surfaced in this plan's tests; no engine code changed. Earlier gaps (Chris 15 MP, FPS West) remain from 53-03.

## Verification

- `node --check` list clean; `npm test`: 89 files / 855 tests pass; mpCost audit and card-editor round-trip green.
- `git diff` on src/engine, src/abilities, src/bot: empty.
- DATA-03 ticked; DATA-01 left pending (finishes in 53-06).

## Self-Check: PASSED
