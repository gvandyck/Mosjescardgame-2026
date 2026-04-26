---
name: Card-type selector options ruling
description: What options the shared card-type selector modal uses for West (#9b) and Geen Raad (#12)
type: project
---

Card-type selector modal uses these five options (matching the card's `type` field):
- Mosje → `type === 'MOSJE'`
- Piecie → `type === 'PIECIE'`
- Snelle Piecie → `type === 'SNELLE_PIECIE'`
- Place → `type === 'PLACE'`
- Personal Quest → `type === 'QUEST'`

**Why:** Fighting/Digital/Artistic only applies to Mosjes. Most cards in a deck are Piecies/Quests, so guessing Mosje is intentionally low-probability. Mosje count per deck will be rebalanced later — do not change these options preemptively.

**How to apply:** Use this exact set for both West's Calculated Guess (#9b) and Geen Raad Vraag Aad (#12). The modal function is `showCardTypeSelector(title)` in `modalManager.js`.
