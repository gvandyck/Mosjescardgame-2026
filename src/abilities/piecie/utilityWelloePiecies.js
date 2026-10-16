// utilityWelloePiecies - Card List 2.0 Utility Piecies that bring a Mosje back from the Welloe pile:
// Mosje Reborn (starting MP + 30) and Call of the Welloes (starting MP, linked both ways with its card).
import { cloneState } from './cloneState.js';
import { summonFromWelloe } from './summonFromWelloe.js';
import { welloePileOptions } from './welloePileOptions.js';
import { canLeaveWelloePile } from '../../engine/table/canLeaveWelloePile.js';

// Shared pause + summon. Returns the state, or { state, needChoice } while the player picks the Mosje.
function summonPicked(gameState, playerId, key, prompt, bonus, link) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	if (!me || !canLeaveWelloePile(state) || !me.activeSlots.some(s => s === null)) return state;
	const options = welloePileOptions(me);
	if (!options.length) return state;
	const pick = me._pendingTargets?.[key];
	if (pick === undefined) return { state, needChoice: { playerId, choiceKind: 'welloeMosje', key, options, prompt } };
	delete me._pendingTargets[key];
	const si = summonFromWelloe(state, playerId, pick.cardId, bonus);
	if (si >= 0 && link) link(state, me, si);
	return state;
}

// Mosje Reborn (limit 1): a chosen Welloe-pile Mosje onto a free spot, Level 1, starting MP + 30, fresh.
export function effect_mosje_reborn(gameState, playerId) {
	return summonPicked(gameState, playerId, 'reborn_mosje', 'Choose a Mosje from your Welloe pile', 30, null);
}

// Call of the Welloes: Level 1 with starting MP, fresh. Mosje and card are linked both ways (summonedByPiecie /
// linkedMosjeCardId); the Stays sweep and markMosjeDefeated end whichever side is left.
export function effect_call_of_welloes(gameState, playerId, ctx = {}) {
	const link = (state, me, si) => {
		me.activeSlots[si].summonedByPiecie = 'piecie_call_of_welloes';
		const entry = ctx.slotIndex >= 0 ? me.piecieSlots?.[ctx.slotIndex] : null;
		if (entry) entry.linkedMosjeCardId = me.activeSlots[si].cardId;
	};
	return summonPicked(gameState, playerId, 'call_mosje', 'Choose a Mosje from your Welloe pile', 0, link);
}
