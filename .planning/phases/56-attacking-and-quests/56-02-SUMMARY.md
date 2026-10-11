---
phase: 56
plan: 02
requirements-completed: []
---
# Phase 56 Plan 02: Quest dice, bands, stacks Summary

Pure one-function modules in `src/engine/quests/`: `getQuestDef`, `getBaseQuestDice`, `questDiceSources` (Place/Snelle/player dice, fresh Mosjes get no Place die), `getQuestDiceCount` (single clamp 1..4), `rollQuestDice` (injectable rng), `isBandWin`, `advanceQuestStack` (tokens, discard, reshuffle of own discards).

Tests: E15 `quest-dice`, E16 `quest-bands` (plus data guard on 2.0 Quest rows), E17 unit `quest-stacks`. RED commit then GREEN commit. `npm test`: 1183 passed.

Deviation: my own RED test for the reshuffle case had wrong expected order (reverse shuffle of [x,y,a]); corrected the expectation, not the assertion's intent.

PLAY-04 / PLAY-06 stay unticked: completed by 56-03 (wiring into the attempt). Place ids: place_the_gym, place_arcade, place_de_box, place_tesla.
