---
created: 2026-07-13
title: Coert's Caravan text vs code — missing Binti Piecie discount
area: general
files:
  - src/data/places.js:159 (text)
  - src/abilities/placeEffects.js:250-273 (code)
---

## Problem

Coert's Caravan (Place card, TURN_START trigger) description reads: "Turn Start: Coert Mosjes gain +15 MP. All Binti Piecies cost 5 less MP." — but `effect_coerts_caravan` in `src/abilities/placeEffects.js` (~250-273) only implements the +15 MP part for Coert Mosjes. No Binti Piecie cost reduction exists anywhere in the engine.

Found 2026-07-13 while researching reuse patterns for the 9-Mosje ability-text-engine reconciliation todo (`2026-07-12-ability-text-engine-reconciliation.md`) — purely incidental discovery, not part of that todo's scope.

## Solution

Same per-card ruling process as the Mosje reconciliation todo: confirm with Gandoe whether code wins (drop the Binti-discount line from the text) or text wins (implement a Piecie MP-cost reduction for Binti-tagged Piecies while this Place is active).

**Correction (2026-07-14):** an earlier version of this todo claimed "Piecie activation has no MP-cost concept at all" — that is FALSE. Every Piecie has an `mpCost` field (`src/data/piecies.js`, values 0/5/10/15/20/25), it's shown in the UI (`main.js:704`, `modalManager.js:467`) and used mechanically (refunded on discard at `piecieEffects.js:633`; the engine supports "self-charging cost abilities" per `turnManager.js:97`/`:1134`). So a Binti discount is a straightforward hook into the existing `mpCost` field — NOT a new mechanic. Ruling still open (text-wins vs code-wins), to be decided in the Places audit round.
