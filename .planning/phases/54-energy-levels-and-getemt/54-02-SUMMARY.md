---
phase: 54-energy-levels-and-getemt
plan: 02
subsystem: engine
tags: [energy, obby-2.0, turn-manager, welloe-force]
requires: ["54-01"]
provides:
  - "Energy charged in activatePiecie, playSnellie, activatePlace (refused when short)"
  - "Welloe Force without MP tribute"
affects: [54-03, 54-04]
key-files:
  modified:
    - src/engine/turnManager.js
    - src/abilities/piecieEffects.js
    - src/abilities/questLogic.js
    - src/main.js
    - src/ui/modalManager.js
  created:
    - tests/engine/energy-charging.test.ts
key-decisions:
  - "Place Energy is paid in activatePlace (when it starts working); face-down playPlace stays free until Phase 57"
requirements-completed: []
duration: 15min
completed: 2026-10-11
---

# Phase 54 Plan 02: Energy Charging Summary

Piecie activation, Snelle play and Place activation now pay `cost` in Energy after validation and before mutation; short Energy refuses with the original state. Welloe Force no longer takes 40 MP; the tribute picker is gone.

## Commits
- 2ff5bc0 charge Energy (Task 1)
- 2a467e9 Welloe Force (Task 2)

## Tests
- Rewritten: tests/abilities/welloe-force-tribute.test.ts (Energy, not MP)
- Deleted: tests/ui/welloe-force-tribute.spec.js (picker removed)
- New: tests/engine/energy-charging.test.ts (9 cases incl. Chris DDR free chain)
- Fixtures given `energy: 6`: the five listed files plus tests/bot/botDriver.test.ts
- npm test: 95 files / 986 tests green; node --check list clean.

## Notes
- No free-activation flags (chainReactionActive, freePiecieActivationAvailable) are read inside activatePiecie; free chains call effect functions directly, so nothing needed special handling.
- showTributePayerSelect had no other users; definition and both registrations deleted.

## Deviations
**[Rule 1 - Bug] Winston quest side effect used `player.discard` (nonexistent; players use `graveyard`)**
- Found via offlineGame.smoke test: refused Piecies changed the bot's path and hit this latent crash.
- Fix: questLogic.js uses `graveyard` with a guard. Included in commit 2ff5bc0.

Also fixed bot test fixtures (botDriver.test.ts) beyond the listed five files.

## Self-Check: PASSED
