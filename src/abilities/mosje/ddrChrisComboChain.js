// Dancing/DDR Chris — Perfect Combo Chain: whenever his owner activates a Piecie (paid), roll a die:
// 5-6 activate another ready Piecie of theirs for free. Up to 2 times per turn: the counter ddrChainsThisTurn
// (reset in startTurn) counts successful free activations. A free activation never starts the roll (chain rule).
import { rollDie } from '../../engine/deckEngine.js';
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';
import { readyPiecieSlots } from '../../engine/table/readyPiecieSlots.js';

const KEY = 'ddr_piecie';
const MAX_PER_TURN = 2;

export const ddrChrisComboChain = {
	mosjeId: 'mosje_chris_ddr',
	run(state, ctx) {
		if (ctx.free) return state;
		const owner = state.players[ctx.ownerId];
		let roll = ctx.ddrRoll;
		if (roll === undefined) {
			if ((owner.ddrChainsThisTurn || 0) >= MAX_PER_TURN) return state;
			roll = rollDie(6);
		}
		if (roll < 5) return state;
		const options = readyPiecieSlots(state, ctx.ownerId);
		if (!options.length) return state; // nothing ready: no activation, not counted
		const pick = owner._pendingTargets?.[KEY];
		if (pick === undefined) {
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'ownPiecieSlot', key: KEY, options, ctx: { ddrRoll: roll } } };
		}
		if (owner._pendingTargets) delete owner._pendingTargets[KEY];
		const res = activatePiecieFree(state, ctx.ownerId, { slotIndex: pick.slotIndex }, { source: 'ddr_chris_combo_chain', skipReactions: true });
		if (!res.success) return state;
		res.state.players[ctx.ownerId].ddrChainsThisTurn = (owner.ddrChainsThisTurn || 0) + 1;
		return res.state;
	},
};
