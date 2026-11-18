// Chris, The BigStepper — Perfect Combo Chain: whenever his owner activates a Piecie (paid or free), roll a die:
// 5-6 they may activate another ready Piecie of theirs for free. Up to 2 free activations per turn: the counter
// ddrChainsThisTurn (reset in startTurn) is raised when the free activation starts and checked before every roll,
// so a chain always ends. The pause has a last "no" option (slotIndex -1): nothing happens, nothing is counted.
import { rollDie } from '../../engine/deckEngine.js';
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';
import { readyPiecieSlots } from '../../engine/table/readyPiecieSlots.js';

const KEY = 'ddr_piecie';
const MAX_PER_TURN = 2;
const NO_PIECIE = { label: 'No free Piecie', slotIndex: -1 };

export const ddrChrisComboChain = {
	mosjeId: 'mosje_chris_ddr',
	run(state, ctx) {
		const owner = state.players[ctx.ownerId];
		let roll = ctx.ddrRoll;
		if (roll === undefined) {
			if ((owner.ddrChainsThisTurn || 0) >= MAX_PER_TURN) return state;
			roll = rollDie(6);
		}
		if (roll < 5) return state;
		const ready = readyPiecieSlots(state, ctx.ownerId);
		if (!ready.length) return state; // nothing ready: no activation, not counted
		const options = [...ready, NO_PIECIE];
		const pick = owner._pendingTargets?.[KEY];
		if (pick === undefined) {
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'ownPiecieSlot', key: KEY, options, ctx: { ddrRoll: roll } } };
		}
		if (owner._pendingTargets) delete owner._pendingTargets[KEY];
		if (pick.slotIndex < 0) return state; // "no"
		// Counted before the activation runs: the free Piecie rolls too and must see the cap.
		owner.ddrChainsThisTurn = (owner.ddrChainsThisTurn || 0) + 1;
		const res = activatePiecieFree(state, ctx.ownerId, { slotIndex: pick.slotIndex }, { source: 'ddr_chris_combo_chain', skipReactions: true });
		if (!res.success) {
			owner.ddrChainsThisTurn -= 1;
			return state;
		}
		return res.state;
	},
};
