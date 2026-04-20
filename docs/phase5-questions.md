# Phase 5 Questions

## Q7: jammertje-gepakt — sendToBottomOfDeck primitive missing (Phase 5 Step 2)
Card text: negate targeted card, send that card to the BOTTOM of opponent's deck.
Phase 0 ruling: card goes to BOTTOM of deck, not discard.
No `sendToBottomOfDeck` primitive exists. `returnToHand` cannot target deck_bottom.
**Status:** Flagged. `jammertje-gepakt` uses `returnToHand` to discard as a temporary
stub. Full implementation deferred until a `sendToBottomOfDeck` primitive is added.

## Q8: drain-reversal — $pendingEffectSource cannot resolve to MosjeRef (Phase 5 Step 2)
Card text uses `$pendingEffectSource` in a `checkMP` condition.
`EffectSource` is `{ kind, cardId? }` — not a `MosjeRef` with `{ playerId, instanceId }`.
No resolution path from source to a specific Mosje exists without additional context.
**Status:** Flagged. The `checkMP` guard on drain-reversal is simplified to always execute
the drain reversal (guard removed). The `$pendingEffectDrainAmount` placeholder is
implemented and resolves to `respondingToPendingEffect.params.amount ?? 0`.

## Q9: jantje-jantje-jantje — discard cost requires player choice (Phase 5 Step 3)
Card text: `cost: { type: 'discard', discardCount: 1 }`.
The executor currently treats `type: 'discard'` as a no-op (no choice collection).
To properly deduct a card from hand, a player choice `$choice:discardCardId` is needed.
**Status:** Flagged. `jantje-jantje-jantje` is registered with `cost: { type: 'discard', discardCount: 1 }`
but the discard is a no-op in cost payment. Full discard-cost implementation deferred.
