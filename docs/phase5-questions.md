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

## Q10: jensen — "send piecie to discard" not implemented (Phase 5 Step 1)
Card text: negate the Piecie targeting your Mosje AND send that Piecie to its owner's discard.
Requires reverse-lookup: given a `pendingEffectId`, find which player's hand/field contains
the source card and move it to their discard pile. No primitive for this exists.
**Status:** Flagged. `snelle_jensen` implements `negateEffect` only. "Send to discard" deferred
until a `discardCardBySourceEffect` primitive (or similar) is added.

## Q11: je-weet-niet — 2-turn MP immunity implemented as oversized reduction (Phase 5 Step 1)
Card text: negate ALL MP loss for active Mosje this turn AND next player's turn.
Proper implementation requires a `negate_mp_loss_turns` flag checked in `loseMP` with
per-turn decrement in `clearExpiredBuffs`. Currently implemented as `reduceMPLossBy(9999, 2)`
which achieves effective immunity via Math.max(0, amount - 9999) = 0.
**Status:** Accepted temporary approach. Full `mp_loss_immune` flag handling deferred.
