// canDjReroll — slot index of `playerId`'s upright DJ 80/20 whose Lucky Beats reroll is still unused this turn
// (once per turn; the turn is "round:active player" because the reroll also happens on the opponent's turn), else -1.
import { canMosjeAct } from '../../engine/mp/canMosjeAct.js';

export const djTurnKey = (state) => `${state.turnNumber}:${state.activePlayerId}`;

export function canDjReroll(state, playerId) {
	const slots = state.players?.[playerId]?.activeSlots || [];
	return slots.findIndex(s => s && s.cardId === 'mosje_dj_8020' && canMosjeAct(s) && s.djRerollTurn !== djTurnKey(state));
}
