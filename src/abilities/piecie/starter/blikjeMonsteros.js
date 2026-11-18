// Blikje Monsteros: "One of your Mosjes loses 15 MP; gain 2 Energy this turn. A Youri also draws 1."
// The 15 MP is the activationCost (paid before this runs); ctx.costPaidBy is the Mosje that paid.
// CC: "gain 2 Energy" is a plain gain capped at 6; Energy not spent carries over like any Energy.
import { gainEnergy } from '../../../engine/energy/gainEnergy.js';
import { drawFromEffect } from '../../../engine/turn/drawFromEffect.js';
import { isFriend } from '../../../engine/friends/isFriend.js';

export function effect_blikje_monsteros(gameState, playerId, ctx = {}) {
	let state = JSON.parse(JSON.stringify(gameState));
	gainEnergy(state, playerId, 2);
	const payer = Number.isInteger(ctx.costPaidBy) ? state.players[playerId].activeSlots[ctx.costPaidBy] : null;
	if (payer && isFriend(payer, ['Youri'])) state = drawFromEffect(state, playerId, 1);
	return state;
}
