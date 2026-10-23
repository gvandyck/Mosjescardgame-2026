// getFieldSlots.js — how many tile columns a board row is sized for (63-UI-SPEC "Board geometry", D-13).
// 2 Mosje + 3 Piecie + deck + discard = 7; 8 while either player's Welloe pile has cards.
// Both rows use the same value so the tiles of the two rows stay equal in size.
export function getFieldSlots(players) {
	const list = Array.isArray(players) ? players : Object.values(players || {});
	const anyWelloe = list.some((player) => (player?.welloePile?.length ?? 0) >= 1);
	return anyWelloe ? 8 : 7;
}
