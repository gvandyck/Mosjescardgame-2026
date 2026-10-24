// getTileBadges.js — the state badges of one Mosje tile, in display order (63-UI-SPEC "Tile states", D-15, D-16, D-06).
// tile = a toMosjeTileCards entry. Returns [{ kind, label, reason }]; label is the short pill word, reason the full
// sentence a tap or hover shows. Level 3 HOLD is NOT a badge: it is the tile's gold glow, its chip and the status strip.
const BADGES = {
	fresh: { label: 'FRESH', reason: "Fresh: can't attack, can't be chosen by opponent cards, ignores Places" },
	protected: { label: 'PROTECTED', reason: "Levelled up this turn: can't be attacked" },
	sideways: { label: 'SKIPS TURN', reason: 'Hit at Level 1: skips its next turn. Can still be attacked' },
	acted: { label: 'ACTED', reason: 'Already acted this turn' },
};

export function getTileBadges(tile) {
	if (!tile || tile.isDefeated) return [];
	const kinds = [];
	if (tile.entryProtected) kinds.push('fresh');
	if (tile.levelUpProtected) kinds.push('protected');
	if (tile.sideways) kinds.push('sideways');
	if (tile.actedThisTurn) kinds.push('acted');
	return kinds.map(kind => ({ kind, ...BADGES[kind] }));
}
