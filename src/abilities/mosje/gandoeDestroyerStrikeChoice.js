// Gandoe, The Destroyer — Elimination Strike (resolution), as a MOSJE_TRIGGERS 'destroyerStrike' entry so a tie can
// pause for the owner's pick (pendingChoice). Target: the opponent's lowest-level Mosje, fresh ones excluded
// (Card List ruling). One candidate = it goes to the Welloe pile; several tied = the owner chooses.
import { markMosjeDefeated } from '../../engine/victoryChecker.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getStrikeCandidates } from './getStrikeCandidates.js';

const KEY = 'destroyer_strike_target';

export const gandoeDestroyerStrikeChoice = {
	mosjeId: 'mosje_gandoe_destroyer',
	run(state, ctx) {
		const oppId = Object.keys(state.players).find(id => id !== ctx.ownerId);
		const pick = state.players[ctx.ownerId]._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = getStrikeCandidates(state, oppId);
			if (options.length > 1) return { needChoice: { playerId: ctx.ownerId, choiceKind: 'oppMosje', key: KEY, options } };
			if (options.length === 0) return state;
			return markMosjeDefeated(state, oppId, options[0].slotIndex);
		}
		const slot = state.players[oppId].activeSlots[pick.slotIndex];
		if (!slot || slot.isDefeated || isFresh(slot)) return state;
		return markMosjeDefeated(state, oppId, pick.slotIndex);
	},
};
