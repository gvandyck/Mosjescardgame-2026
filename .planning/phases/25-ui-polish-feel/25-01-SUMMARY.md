---
phase: 25-ui-polish-feel
plan: "01"
subsystem: ui-animations
tags: [css-animations, quest-feedback, ui-polish]
dependency_graph:
  requires: []
  provides: [quest-result-animations]
  affects: [styles/cards.css, src/ui/boardRenderer.js, src/ui/actionAnimations.js, src/main.js]
tech_stack:
  added: []
  patterns: [CSS keyframe animations, animationend cleanup pattern, options-object dispatch]
key_files:
  created: []
  modified:
    - styles/cards.css
    - src/ui/boardRenderer.js
    - src/ui/actionAnimations.js
    - src/main.js
decisions:
  - Quest fail uses quest-fail-shake (distinct from taking-damage) — longer duration (0.65s vs 0.44s), red tint via sepia/hue-rotate filter
  - animateLevelUpCelebration reuses level-up-text element from animateLevelUp — gold burst replaces blue burst for quest level-ups
  - questDidSucceed added to 4 call sites: 2 renderAndAnimate (Geen Raad + general quest) + 2 animateStateDelta (personal quest + Perfect Sync path)
  - Geen Raad recovery call site (actionLabel quest-recovery) left unchanged — no didSucceed in scope, not a win/fail outcome
metrics:
  duration: "15 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 4
---

# Phase 25 Plan 01: Quest Result Animations Summary

Three new CSS animation classes (quest-success-flash, quest-fail-shake, quest-level-up-celebration) wired into the existing animateMosjeDeltas pipeline so every quest resolution shows distinct visual feedback — green glow on success, red shake on fail, gold burst on level-up-from-quest.

## What Was Built

**Task 1 — CSS keyframes (cdb866b)**
- `@keyframes quest-success-flash`: green glow pulse (0.8s, rgba 74/222/128)
- `@keyframes quest-fail-shake`: red-tinted shake (0.65s, sepia/hue-rotate filter)
- `@keyframes quest-level-up-celebration`: large gold burst (1.2s, scale 1.12)
- All three suppressed inside the existing `@media (prefers-reduced-motion: reduce)` block

**Task 2 — JS wiring (a6051c9)**
- `animateQuestSuccess`, `animateQuestFail`, `animateLevelUpCelebration` exported from boardRenderer.js
- `animateMosjeDeltas` in actionAnimations.js: branches on `isQuestOutcome && options.questDidSucceed` for level-up (celebration vs standard), then fires quest-specific flash/shake for any quest outcome
- `questDidSucceed: didSucceed` added to all four quest-resolution call sites in main.js

## Verification

- `node --check` on all six UI files: clean (no output)
- `npm test`: 920 tests passing, 0 failures

## Checkpoint

**Task 3** is a `checkpoint:human-verify` — visual confirmation in-game required.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- styles/cards.css modified: confirmed (quest-success-flash appears 4x)
- src/ui/boardRenderer.js modified: confirmed (animateQuestSuccess exported)
- src/ui/actionAnimations.js modified: confirmed (questDidSucceed appears 2x)
- src/main.js modified: confirmed (questDidSucceed appears 4x)
- Commits cdb866b and a6051c9 exist in git log
