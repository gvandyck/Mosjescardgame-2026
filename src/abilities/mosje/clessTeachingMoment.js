// Cless, The Teacher — Teaching Moment: whenever her owner activates a Piecie (paid), roll a die:
// 5-6 (4-6 while the Martin, The Historian holder text is live) draw 1 card and one of the owner's Mosjes gains 5 MP.
// A free activation never starts the roll (chain rule).
import { rollDie, drawCards } from '../../engine/deckEngine.js';
import { gainMP } from '../../engine/mpManager.js';
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';

const KEY = 'teacher_target';

export const clessTeachingMoment = {
	mosjeId: 'mosje_cless_teacher',
	run(state, ctx) {
		if (ctx.free) return state;
		const owner = state.players[ctx.ownerId];
		let roll = ctx.clessRoll;
		if (roll === undefined) {
			roll = rollDie(6);
			const need = isHolderTextActive(state, ctx.ownerId, 'mosje_martin_historian') ? 4 : 5;
			if (roll < need) return state;
			const { drawn, remaining } = drawCards(owner.deck, 1); // mid-turn: no reshuffle
			owner.deck = remaining;
			owner.hand.push(...drawn);
		}
		const pick = owner._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = owner.activeSlots.map((s, slotIndex) => ({ s, slotIndex }))
				.filter(({ s }) => s && !s.isDefeated)
				.map(({ s, slotIndex }) => ({ label: s.name, slotIndex }));
			if (!options.length) return state;
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'ownMosje', key: KEY, options, ctx: { clessRoll: roll } } };
		}
		if (owner._pendingTargets) delete owner._pendingTargets[KEY];
		return gainMP(state, ctx.ownerId, pick.slotIndex, 5, 'ABILITY');
	},
};
