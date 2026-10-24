// findBoardTile.js — the table tile element for a card key { kind: 'mosje' | 'piecie' | 'place', playerId, slotIndex }
// inside the board root, or null (the board is redrawn on every state change, so the controller looks tiles up by key).
export function findBoardTile(board, key) {
	if (!board || !key) return null;
	if (key.kind === 'place') return board.querySelector('[data-zone="place"]');
	const player = CSS.escape(String(key.playerId));
	return board.querySelector(`[data-zone="${key.kind}"][data-player-id="${player}"][data-slot-index="${Number(key.slotIndex)}"]`);
}
