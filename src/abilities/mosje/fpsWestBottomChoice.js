// FPS West (second half), as a MOSJE_TRIGGERS 'fpsWestBottom' entry so the owner's choice can pause (pendingChoice).
// He may lose 20 MP (a price: only while he stays above 0) to put 1 card of the opponent's hand on the bottom of their
// deck; they draw 1. A Personal Quest is never an option (D-13). First option "Leave it" so a default answer costs nothing.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { opponentPickableHand } from '../../engine/hand/opponentPickableHand.js';
import { canPayMpCost } from '../../engine/costs/canPayMpCost.js';
import { payMpCost } from '../../engine/costs/payMpCost.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';

const KEY = 'fps_west_bottom';
const PRICE = 20;

export const fpsWestBottomChoice = {
	mosjeId: 'mosje_fps_west',
	run(state, ctx) {
		const owner = state.players[ctx.ownerId];
		const oppId = Object.keys(state.players).find(id => id !== ctx.ownerId);
		const opp = state.players[oppId];
		const west = owner.activeSlots[ctx.holderSlotIndex];
		const pickable = opponentPickableHand(opp?.hand);
		if (!canPayMpCost(west, PRICE) || !pickable.length) return state;
		const pick = owner._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = [{ label: 'Leave it', index: -1 },
				...pickable.map(index => ({ label: toGraveyardEntry(opp.hand[index].cardId, 'x').name, index }))];
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'handCard', key: KEY, options } };
		}
		if (owner._pendingTargets) delete owner._pendingTargets[KEY];
		if (!pickable.includes(pick.index)) return state; // "Leave it" (or anything not listed): nothing happens
		payMpCost(west, PRICE);
		opp.deck.push(opp.hand.splice(pick.index, 1)[0]);
		return drawFromEffect(state, oppId, 1);
	},
};
