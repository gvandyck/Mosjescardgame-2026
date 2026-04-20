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
