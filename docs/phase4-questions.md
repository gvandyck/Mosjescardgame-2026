# Phase 4 Questions

## Resolved in Phase 4B Prep
- Chef's Special per-Piecie multiplier is now implemented using `multiplyByCount`
	+ `countCardsInZone` (with cap handling).
- `$opponent` placeholder is now supported for 2-player games and intentionally
	throws in multiplayer with:
	"Use forEachTarget for multiplayer opponent targeting, not $opponent."

## Q3: Zie Je Die Dingetjes top-3 choose behavior
Card text implies choosing 1 card from the top 3 cards. Current Phase 4A uses
the approved simplification: `lookAtTop` for 3 cards and `drawCards` top 1.
Full choose-from-top wiring remains pending for later phases.

## Q4: Call of the Welloes summon semantics
Card intent is summoning a Mosje directly from welloe to board. We do not yet
have `summonFromWelloe`, so Step 1 uses the approved `returnToHand` stub with
player choice (`$choice:mosjeId`).

Intended behavior is Call of the Haunted-style: choose a Mosje in a Welloe pile
and summon it to the field at Level 1, 0 MP. Call of the Welloes remains linked
to that Mosje while it is on the field. If Call of the Welloes leaves play, the
summoned Mosje returns to Welloe. If the summoned Mosje leaves the field first,
Call of the Welloes should be discarded/cleared with it.

## Q5: Dingetje Toch revealed-card check primitive
Card intent depends on checking revealed card type from the top deck card.
There is no `checkRevealedCardType` primitive yet, so Step 1 uses approved
fallback behavior: if active mosje MP >= 120 gain 30 MP, else draw 1.

## Q6: double-trigger executor double-activation (Phase 4C Step 2)
`double-trigger` applies `buff:double_activate_this_turn` to the acting Mosje via
`applyBuff`. The executor does not yet consume this flag to run a card's effects
twice. Double-activation behavior is deferred to a future phase; the buff itself
is correctly applied and cleared by `clearExpiredBuffs`.
