// fallen.js - test helpers for the one pile (2.1 rules section 10): fallen Mosjes are 'MOSJE' entries of player.graveyard.
export const fallen = (player) => (player?.graveyard || []).filter((e) => e?.type === 'MOSJE');
export const discarded = (player) => (player?.graveyard || []).filter((e) => e?.type !== 'MOSJE');

// Test-only view for the browser specs: adds a read-only `welloePile` (the fallen Mosjes) next to the one real pile,
// so a spec can still say "players.player_2.welloePile.length". The engine has no such field.
export function withFallenView(state) {
	for (const p of Object.values(state?.players || {})) {
		if (p && typeof p === 'object') Object.defineProperty(p, 'welloePile', { value: fallen(p), enumerable: false, configurable: true });
	}
	return state;
}
