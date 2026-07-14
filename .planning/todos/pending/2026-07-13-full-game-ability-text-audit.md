---
created: 2026-07-13
title: Full-game ability-text-vs-engine audit (Piecies + Places + remaining Mosjes)
area: general
files:
  - src/data/mosjes.js (abilityDescription fields)
  - src/data/piecies.js (description fields)
  - src/data/snellePiecies.js (description fields)
  - src/data/places.js (description fields)
---

## Problem

The 2026-07-12 synergy-text audit only checked 9 flagged Mosjes (see `2026-07-12-ability-text-engine-reconciliation.md`). While resolving those 9 on 2026-07-13, an unrelated text/code mismatch turned up by accident on a Place card (Coert's Caravan — see `2026-07-13-coerts-caravan-binti-discount-mismatch.md`), found purely while researching reuse patterns, not by deliberate audit. That suggests more undiscovered divergences exist outside the original 9-card list — across Piecies, Snelle Piecies, and Places, none of which have been systematically checked yet.

## Solution

Once the current 9-Mosje reconciliation ships, run a systematic pass checking EVERY card's `abilityDescription`/`description` text against its actual effect/ability function, across all of `src/data/mosjes.js`, `src/data/piecies.js`, `src/data/snellePiecies.js`, and `src/data/places.js` — not just cards already known to be wrong.

Precedent for resolving each divergence found: AZN Cless (2026-07-11 — "code, not text, is the intended design") and the 9-Mosje session (2026-07-13 — per-card interactive rulings with Gandoe via AskUserQuestion, no batch-fixing, reuse-pattern research before implementing).
