// countActionsLeft.js — how many of a player's Mosjes can still attack or Quest right now (63-UI-SPEC "End Turn", D-11).
// It feeds the "N actions left" hint on End Turn and decides whether ending the turn asks for a confirm. A Mosje counts once
// when its Attack or its Quest tray chip is enabled, so the number is 0 off-turn, on a cooldown turn, in a finished game and
// once every Mosje has acted. Reuses getTrayActions so the hint can never disagree with the tray. Pure: never changes state.
import { getTrayActions } from './getTrayActions.js';

export function countActionsLeft(state, playerId) {
	if (!state || state.status === 'FINISHED' || state.activePlayerId !== playerId) return 0;
	const slots = state.players?.[playerId]?.activeSlots || [];
	let left = 0;
	slots.forEach((slot, slotIndex) => {
		if (!slot || slot.isDefeated) return;
		const chips = getTrayActions(state, playerId, { kind: 'mosje', slotIndex });
		if (chips.some((chip) => (chip.action === 'attack' || chip.action === 'quest') && !chip.disabled)) left += 1;
	});
	return left;
}
