// Jisca, The Maestro — Perfect Combo: once per turn, after her owner activates a Piecie (paid), roll a die:
// 4-6 activate another ready Piecie of theirs for free and one opponent Mosje (owner's choice, not fresh) loses 15 MP;
// 1-3 Jisca loses 10 MP (ignored at 0 MP). A free activation never starts the roll (chain rule).
// Picks (slot, then opponent) are asked first; nothing happens until both are known. "Once per turn" = her first paid
// activation each turn (flag jiscaRolledThisTurn, reset in startTurn).
import { rollDie } from '../../engine/deckEngine.js';
import { loseMP } from '../../engine/mpManager.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';
import { readyPiecieSlots } from '../../engine/table/readyPiecieSlots.js';

const SLOT_KEY = 'jisca_piecie';
const TARGET_KEY = 'jisca_target';

export const jiscaPerfectCombo = {
	mosjeId: 'mosje_jisca',
	run(state, ctx) {
		if (ctx.free) return state;
		const owner = state.players[ctx.ownerId];
		let roll = ctx.jiscaRoll;
		if (roll === undefined) {
			if (owner.jiscaRolledThisTurn) return state;
			owner.jiscaRolledThisTurn = true;
			roll = rollDie(6);
		}
		if (roll <= 3) {
			const self = owner.activeSlots[ctx.holderSlotIndex];
			return self.mp > 0 ? loseMP(state, ctx.ownerId, ctx.holderSlotIndex, 10, 'ABILITY', false, ctx.ownerId) : state;
		}
		const oppId = Object.keys(state.players).find(id => id !== ctx.ownerId);
		const slotOptions = readyPiecieSlots(state, ctx.ownerId);
		const slotPick = owner._pendingTargets?.[SLOT_KEY];
		if (slotOptions.length && slotPick === undefined) {
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'ownPiecieSlot', key: SLOT_KEY, options: slotOptions, ctx: { jiscaRoll: roll } } };
		}
		const targetOptions = (state.players[oppId]?.activeSlots || [])
			.map((s, slotIndex) => ({ s, slotIndex }))
			.filter(({ s }) => s && !s.isDefeated && !isFresh(s))
			.map(({ s, slotIndex }) => ({ label: s.name, playerId: oppId, slotIndex }));
		const targetPick = owner._pendingTargets?.[TARGET_KEY];
		if (targetOptions.length && targetPick === undefined) {
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'oppMosje', key: TARGET_KEY, options: targetOptions, ctx: { jiscaRoll: roll } } };
		}
		if (owner._pendingTargets) { delete owner._pendingTargets[SLOT_KEY]; delete owner._pendingTargets[TARGET_KEY]; }
		let next = state;
		if (slotPick) {
			const res = activatePiecieFree(next, ctx.ownerId, { slotIndex: slotPick.slotIndex }, { source: 'jisca_perfect_combo', skipReactions: true });
			if (res.success) next = res.state;
		}
		const t = targetPick && next.players[targetPick.playerId]?.activeSlots?.[targetPick.slotIndex];
		if (t && !t.isDefeated) next = loseMP(next, targetPick.playerId, targetPick.slotIndex, 15, 'ABILITY', false, ctx.ownerId);
		return next;
	},
};
