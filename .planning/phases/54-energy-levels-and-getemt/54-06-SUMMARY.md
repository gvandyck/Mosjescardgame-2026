---
phase: 54-energy-levels-and-getemt
plan: 06
subsystem: ui
tags: [levels, display, test-hook, obby-2.0]
requires: ["54-05"]
provides:
  - "Every UI level display reads the stored 1-3 level (no +1/-1 adaptors)"
  - "setMosjeOnField test hook builds slots via createMosjeSlot, Level 1 default"
affects: [54-08, 54-16]
key-files:
  modified:
    - src/main.js
    - src/ui/cardV1/buildMosjeSpecV1.js
    - src/ui/cardRenderer.js
    - src/ui/modalManager.js
    - src/ui/hoverZoom.js
    - src/ui/boardRenderer.js
    - tests/ui/card-v1-mosje.test.ts
    - tests/ui/helpers.js
    - tests/ui/cards/card-registry.js
    - tests/ui/cards/card-test-runner.js
    - tests/abilities/amplifier-hacker-rework.test.ts
    - tests/abilities/dead-flag-engine.test.ts
key-decisions:
  - "Display clamps stored level to 1..3, fallback 1 when a card has no slot"
requirements-completed: []
duration: 15min
completed: 2026-10-11
---

# Phase 54 Plan 06: Level display on 1-3 Summary

Card faces, field tiles, modals, hover zoom, MP bar and the battle log now show the stored level as-is; a fresh Mosje shows Level 1 and a Level 3 Mosje shows 3.

## Commits
- 8a8fe15 display adaptors removed, hook uses createMosjeSlot (Task 1)
- c07414e card-test registry/runner/helper docs, ability fixtures level 0 -> 1 (Task 2)

## Notes
- Removed adaptors: buildMosjeSpecV1, cardRenderer (Lv chip, level text), modalManager (target LV, detail chip), boardRenderer.updateMPBar (found beyond the plan list), hoverZoom (-1 parse), main.js log "level A -> B". West check is now `level === 1 && mp === 0`.
- Hook: `setMosjeOnField` defaults level 1; deletes `entryProtected` unless requested. The factory rounds MP to a multiple of 5 (five-grid rule), so a seeded odd MP would be rounded.
- Ronald Kip card test no longer seeds `ownLevel`; ownLevel mechanism kept.
- Left alone as planned: actionAnimations.js (order-safe), win text (54-12). `cardRenderer.js` line 418 legacy meta now falls back to 1.
- The card-v1 test was updated together with the code (stored-level expectations); the old assertions would have failed against new code, not run separately red first.
- npm test: 96 files / 995 tests green; node --check list clean. Playwright not run (54-16).

## Deviations
- [Rule 2] boardRenderer.js updateMPBar had a `+1` adaptor not listed in the plan; fixed.

## Known Stubs
None.

## Self-Check: PASSED
