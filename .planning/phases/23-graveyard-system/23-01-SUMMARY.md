---
phase: 23-graveyard-system
plan: "01"
subsystem: engine
tags: [graveyard, tdd, refactor, revival-cards, silent-removal-fix]
dependency_graph:
  requires: []
  provides: [graveyard-data-layer, graveyardUtils]
  affects: [victoryChecker, turnManager, piecieEffects, mosjeAbilities, snelleEffects, gameState]
tech_stack:
  added: [graveyardUtils.js]
  patterns: [pure-function-helpers, typed-graveyard-entries]
key_files:
  created:
    - src/engine/graveyardUtils.js
    - tests/engine/graveyardUtils.test.ts
    - tests/abilities/mosje-reborn-graveyard.test.ts
    - tests/abilities/call-of-welloes-graveyard.test.ts
    - tests/abilities/klaar-met-jou-graveyard.test.ts
    - tests/abilities/those-eyelashes-graveyard.test.ts
  modified:
    - src/engine/victoryChecker.js
    - src/engine/turnManager.js
    - src/engine/gameState.js
    - src/abilities/piecieEffects.js
    - src/abilities/mosjeAbilities.js
    - src/abilities/snelleEffects.js
    - tests/abilities/call-of-welloes.test.ts
    - tests/abilities/dead-flag-mosje.test.ts
    - tests/data/deck-balance.test.ts
    - tests/engine/unified-graveyard.test.ts
    - tests/engine/stub-engine-wiring.test.ts
    - tests/engine/deck-out.test.ts
    - tests/engine/piecie-persist-eot.test.ts
    - tests/engine/quest-haven-double-quest.test.ts
decisions:
  - "player.graveyard is the single destination for all defeated/discarded/destroyed cards"
  - "player.welloe[] eliminated — revival cards now read from getGraveyardByType(player, 'MOSJE')"
  - "Mosje graveyard entries carry full slot object merged with type:'MOSJE', source:'defeated'"
  - "addToGraveyard returns new state via spread — no mutation (immutable reducer pattern)"
  - "confirmCallOfWelloes now splices from player.graveyard filtered by type:'MOSJE'"
  - "TS declarative registry files (src/engine/reducers/) left unchanged — separate system"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-04"
  tasks_completed: 2
  files_modified: 20
---

# Phase 23 Plan 01: Graveyard Data Layer Summary

Unified graveyard as sole destination for all defeated/discarded/destroyed cards — eliminated player.welloe[], fixed revival cards to read from graveyard, corrected two silent-removal bugs (Klaar met Jou, Those Eyelashes), and renamed player.discard to player.graveyard across all engine/abilities JS files.

## Tasks Completed

| Task | Type | Commit | Description |
|------|------|--------|-------------|
| 1 | RED | a6cb720 | 5 failing test files for graveyard utils, revival cards, silent-removal bugs |
| 2 | GREEN | ed7dfc5 | graveyardUtils.js + all engine/abilities fixes + discard→graveyard rename |

## What Was Built

### graveyardUtils.js (new)
Three pure helper functions per D-07/D-08:
- `toGraveyardEntry(cardId, allCardData, source)` — builds typed entry from card data lookup
- `addToGraveyard(state, playerId, cardId, allCardData, source)` — returns new state via spread
- `getGraveyardByType(player, type)` — filters graveyard by type string

### markMosjeDefeated (victoryChecker.js)
Previously pushed to BOTH `player.welloe` (full) AND `player.discard` (slim). Now pushes ONE full entry to `player.graveyard` with `type:'MOSJE', source:'defeated'`. Tesla block and Call of the Welloes anchor block also updated to push typed graveyard entries.

### effect_mosje_reborn
Was: `player.welloe.shift()`
Now: `getGraveyardByType(player, 'MOSJE')[0]` + splice from graveyard index

### effect_call_of_welloes
Was: `player.welloe.map(w => ...)`
Now: `getGraveyardByType(player, 'MOSJE').map(w => ...)`

### confirmCallOfWelloes
Was: `player.welloe.findIndex/splice`
Now: `player.graveyard.findIndex(e => e.cardId === mosjeCardId && e.type === 'MOSJE')` + splice

### effect_klaar_met_jou (silent-removal bug fix)
Was: `opp.hand.pop()` (card silently removed)
Now: splice + `addToGraveyard(state, oppId, cardId, [...PIECIES, ...MOSJES], 'discarded')`

### effect_those_eyelashes (silent-removal bug fix)
Was: `opp.hand.shift()` (card silently removed)
Now: splice + `addToGraveyard(state, oppId, cardId, [...PIECIES, ...MOSJES], 'discarded')`

### Rename: player.discard → player.graveyard
All occurrences renamed in: turnManager.js, gameState.js, mosjeAbilities.js, snelleEffects.js, piecieEffects.js (huisbaas, tempiecie).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Added graveyard init to gameState.js**
- Found during: Sub-step B/H
- Issue: gameState.js still initialised `discard: [], welloe: []` in player creation
- Fix: Changed to `graveyard: []` and removed `welloe` init
- Files modified: src/engine/gameState.js

**2. [Rule 1 - Bug] Fixed const→let in effect_those_eyelashes**
- Found during: Sub-step G
- Issue: `addToGraveyard` returns new state requiring reassignment, but state was declared `const`
- Fix: Changed `const state = cloneState(...)` to `let state = cloneState(...)`
- Files modified: src/abilities/piecieEffects.js

**3. [Rule 3 - Blocking] Updated 8 additional test files**
- Found during: Sub-step I
- Issue: Tests initialising player state with `discard:[]` or `welloe:[]` would fail at runtime
- Fix: Renamed discard→graveyard, removed welloe init, updated assertions
- Files modified: call-of-welloes.test.ts, dead-flag-mosje.test.ts, deck-balance.test.ts, deck-out.test.ts, piecie-persist-eot.test.ts, quest-haven-double-quest.test.ts, stub-engine-wiring.test.ts, unified-graveyard.test.ts

## TDD Gate Compliance

- RED gate: commit a6cb720 (`test(23-01): RED — failing tests for...`)
- GREEN gate: commit ed7dfc5 (`feat(23-01): GREEN — implement graveyardUtils...`)
- Both gates present in git log. Plan compliant.

## Known Stubs

None. All graveyard reads and writes are wired end-to-end.

## Threat Flags

None. All changes are internal engine state restructuring. The `addToGraveyard` pure-function returns new state via spread (T-23-01 mitigated). `getGraveyardByType` has `?? []` guard (T-23-02 accepted).

## Self-Check: PASSED
- src/engine/graveyardUtils.js exists: FOUND
- Commit a6cb720 exists: FOUND
- Commit ed7dfc5 exists: FOUND
- 912 tests passing, 0 failures
- Zero player.discard or player.welloe refs in src/engine/*.js and src/abilities/*.js
