# Card notification system: decisions (2026-10-04, branch ui/card-frame-v1)

Builds on docs/arena-ui.md (spotlight, effect rows, state-diff detection in actionAnimations.js).

## Decided
- Show effects in BOTH places: spotlight card on the right (effect rows) and in place on the board tile (floating +/- number and colour flash; floating numbers already exist).
- Spotlight while effects show: hide description/info text, keep art + name (current behaviour stays).

## Work items (this round)
1. Heal vs other MP gain: quest rewards / passives must not read as a heal heart; label by source.
2. Effects with no observable state change (e.g. Jammertje "reveal 1 card"): show an info row.
3. Re-tune spotlight / hover popup sizes for the card frame v1 and the 212px field tiles.
4. Several targets hit by one card: show each affected card clearly (per-target rows / numbers).

## Not decided yet
- Exact wording/colours for the new rows; multiplayer sync of the spotlight (remote player's actions).
