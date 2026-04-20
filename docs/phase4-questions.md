# Phase 4 Questions

## Q1: Chef's Special per-Piecie multiplier
Card text implies: if Ronald is on field, gain 30 MP per Piecie card in opponent hand.
Current primitives do not provide a count-and-multiply over opponent hand cards by
card category. For Phase 4A step 2 this is simplified to a flat +30 MP after reveal.

## Q2: Opponent hand reveal target in multiplayer
There is no dedicated '$opponent' placeholder in resolver. Current Step 2
implementation uses `forEachTarget` with `targetType: 'all_opponents'` and
`revealTopDeck` with `count: 99` to approximate revealing opponents' hands.
In 2-player games this matches the intent (single opponent); in multiplayer it
reveals each opponent's hand.
