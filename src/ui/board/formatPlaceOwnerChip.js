// formatPlaceOwnerChip.js — the owner chip text on the Place tile (63-UI-SPEC "Place tile", D-08):
// "YOU · 2 turns" for a Place I played, "BOT · 1 turn" for the opponent's. Plain text; the caller escapes it.
export function formatPlaceOwnerChip({ isMine, turns } = {}) {
	const n = Math.max(0, Math.trunc(Number(turns)) || 0);
	return `${isMine ? 'YOU' : 'BOT'} · ${n} ${n === 1 ? 'turn' : 'turns'}`;
}
