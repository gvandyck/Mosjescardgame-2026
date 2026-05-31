---
phase: 13
name: Action Animations
status: context-captured
date: 2026-05-31
---

# Phase 13 - Action Animations: Context

## Domain

Add a small animation layer to the browser game flow so important actions feel visible and paced:

- placing cards from hand onto the field
- MP gains/losses and level ups
- player turn ending
- next turn starting

This phase is UI-only. It must not change card rules, engine rules, Firebase sync contracts, or the TypeScript simulation engine.

First-pass scope was confirmed with the user on 2026-05-31:

1. card placement pop
2. MP floating numbers and damage shake
3. level-up burst
4. turn start/end banner

Bot step polish, quest dice polish, physical hand-to-board flight, and face-down flip theatrics are deferred until after the first pass feels good.

## Current UI Shape

- `src/main.js` owns browser game flow, action handlers, offline bot sequencing, and `renderFromState()`.
- `src/ui/boardRenderer.js` fully rebuilds `#board-root` with `innerHTML` each render.
- `src/ui/handRenderer.js` fully rebuilds the hand each render.
- `styles/cards.css` already defines card animation keyframes:
  - `.card.just-played`
  - `.card.taking-damage`
- `styles/board.css` already defines:
  - `.mp-float`
  - `.card--mosje.level-up`
  - `.level-up-text`
  - place effect banner animation
  - log entry animation
- `src/ui/boardRenderer.js` already exports helper functions that are mostly unused:
  - `showMPFloat(cardEl, amount)`
  - `animateCardPlay(cardEl)`
  - `animateCardDamage(cardEl)`
  - `animateLevelUp(cardEl)`
  - `showPlaceEffectBanner(placeName, effectSummary, phase)`

## Key Constraint

Because `renderBoard()` replaces board DOM every render, animations should run after render by comparing `beforeState` and `afterState`, then selecting the newly rendered element. Avoid trying to animate old DOM nodes that no longer exist.

## Recommended Architecture

Add `src/ui/actionAnimations.js` as a small coordinator:

- detect state deltas between `beforeState` and `afterState`
- call existing board animation helpers after `renderFromState()`
- expose a `queueActionAnimation()` or `animateStateDelta()` API to `src/main.js`
- respect `prefers-reduced-motion`
- keep timings short and non-blocking

Add stable DOM hooks during rendering:

- card elements should receive `data-card-id`
- Mosje cards should receive `data-player-id` and `data-slot-index`
- Piecie/Place/Quest field cards should receive `data-player-id`, `data-slot-index`, and `data-zone`
- face-down Piecie placeholders need the same player/slot hooks

These hooks make animation targeting deterministic after the board is re-rendered.

## Animation Priority

1. **Card placement pop:** applies to Piecie, Place, Personal Quest, and Mosje plays. No hand-to-board flight in first pass.
2. **MP delta floats + damage shake:** uses existing helpers, makes action effects readable.
3. **Level-up burst:** already styled, needs reliable triggering.
4. **Turn transition banner:** visible, low-risk, no game-rule ambiguity.

## Validation

- `npm run validate`
- Manual browser smoke in offline mode:
  - play a card from hand
  - activate a face-down Piecie
  - attempt a quest that changes MP
  - click End Turn and confirm turn end/start banner appears
  - confirm no layout overlap at desktop and mobile widths
- Manual reduced-motion check by forcing `prefers-reduced-motion: reduce` in dev tools.

## Out Of Scope

- Engine event schema changes
- New card behavior
- Firebase protocol changes
- Long cinematic animations that delay actions
- Rewriting the board renderer to incremental DOM updates
- Bot action sequence polish
- Quest dice-roll animation improvements
- Physical card travel from hand to board
- Dramatic face-down flip animation
