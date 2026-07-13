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

Same per-card ruling process as the Mosje reconciliation todo: confirm with Gandoe whether code wins (drop the Binti-discount line from the text) or text wins (implement a Piecie MP-cost reduction for Binti-tagged Piecies while this Place is active — note Piecie activation in this engine currently has no MP-cost concept at all, so this may require a larger mechanical addition, not just a tweak).
