---
phase: 23-graveyard-system
plan: "02"
subsystem: ui
tags: [graveyard, rename, ui, card-descriptions, docs]
dependency_graph:
  requires: [graveyard-data-layer, graveyardUtils]
  provides: [graveyard-ui, graveyard-docs]
  affects: [modalManager, boardRenderer, main, piecies, snellePiecies, developer-handoff]
tech_stack:
  added: []
  patterns: [legacy-alias-for-safety, label-rename]
key_files:
  created: []
  modified:
    - src/ui/modalManager.js
    - src/ui/boardRenderer.js
    - src/main.js
    - src/data/piecies.js
    - src/data/snellePiecies.js
    - docs/developer-handoff.md
decisions:
  - "showGraveyardModal is canonical; showDiscardViewerModal alias retained in export for unpatched callers"
  - "boardRenderer and modalManager read player.graveyard with || [] fallback per threat model T-23-03"
  - "toBoardViewModel outputs graveyard: player.graveyard (not discard)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-04"
  tasks_completed: 2
  files_modified: 6
---

# Phase 23 Plan 02: UI Graveyard Rename Summary

Renamed all UI-visible "Discard" labels to "Graveyard", wired board and modal to read from player.graveyard, replaced "discard pile" noun phrase in card descriptions, and documented the graveyard system in developer-handoff.md.

## Tasks Completed

| Task | Type | Commit | Description |
|------|------|--------|-------------|
| 1 | feat | 426fa10 | Rename showDiscardViewerModal->showGraveyardModal; board label->Graveyard; main.js graveyard wiring |
| 2 | feat | a11312c | Replace "discard pile" in card descriptions; add Graveyard System section to developer-handoff.md |

## What Was Built

### modalManager.js
- `showGraveyardModal` is the canonical function (reads `player?.graveyard || []`).
- Empty-state header: `{Player}'s Graveyard`.
- Non-empty header: `{Player}'s Graveyard ({count} cards)`.
- Button/close IDs renamed to `modal-close-graveyard`.
- Legacy export alias `showDiscardViewerModal: showGraveyardModal` retained.

### boardRenderer.js
- `renderDiscardPile` reads `player.graveyard || []`.
- `label.textContent = 'Graveyard'`.
- Click fallback calls `getBoardModal().showGraveyardModal(player, isOwned)`.

### main.js
- `toBoardViewModel` outputs `graveyard: player.graveyard` for both top and bottom players.
- `handleOpenDiscard` calls `modal.showGraveyardModal(player, isOwned)`.

### Card data description updates
- **piecies.js** Tempiecie: "from your Graveyard to hand".
- **piecies.js** Huisbaas: "from your Graveyard to your hand".
- **snellePiecies.js** Chillingsvoorbij: "from your Graveyard to your hand".

### docs/developer-handoff.md
New "Graveyard System (Phase 23)" section documents:
- `player.graveyard[]` entry format and removal of legacy `player.discard` / `player.welloe`.
- `graveyardUtils.js` three helpers.
- Revival card behavior (Mosje Reborn, Call of the Welloes).
- UI: `showGraveyardModal`, board label, `toBoardViewModel` output key.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All graveyard reads and writes are wired end-to-end.

## Threat Flags

None. Changes are UI label renames and doc updates. T-23-03 mitigated (`player?.graveyard || []` fallback present). T-23-04 accepted (alias routes to showGraveyardModal).

## Self-Check: PASSED
- src/ui/modalManager.js showGraveyardModal: FOUND
- src/ui/boardRenderer.js Graveyard label: FOUND
- src/main.js graveyard: player.graveyard: FOUND
- Commit 426fa10 exists: FOUND
- Commit a11312c exists: FOUND
- 912 tests passing, 0 failures
- Zero "discard pile" in src/data/*.js
