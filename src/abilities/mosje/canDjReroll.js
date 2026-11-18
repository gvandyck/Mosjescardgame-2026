// canDjReroll — slot index of `playerId`'s upright DJ 80/20 who still has a Lucky Beats reroll left this turn, else -1.
// 2.1: 1 reroll per turn, 2 from Level 2 (the slot's current level). Each reroll is one die. Uses are counted on the slot
// per turn key (`djRerollTurn` = the key of the turn it was used, `djRerollCount` = how many that turn; a stamp without a
// count means 1 use). The turn is "round:active player".
import { canMosjeAct } from '../../engine/mp/canMosjeAct.js';

export const djTurnKey = (state) => `${state.turnNumber}:${state.activePlayerId}`;

export const djRerollsAllowed = (slot) => ((slot?.level || 1) >= 2 ? 2 : 1);

export function djRerollsUsed(state, slot) {
	if (!slot || slot.djRerollTurn !== djTurnKey(state)) return 0;
	return slot.djRerollCount ?? 1;
}

export function canDjReroll(state, playerId) {
	const slots = state.players?.[playerId]?.activeSlots || [];
	return slots.findIndex(s => s && s.cardId === 'mosje_dj_8020' && canMosjeAct(s) && djRerollsUsed(state, s) < djRerollsAllowed(s));
}
