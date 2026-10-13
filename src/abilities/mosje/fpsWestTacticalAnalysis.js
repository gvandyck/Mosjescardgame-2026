// FPS West — Tactical Analysis (settling half). Runs for the OPPONENT's plays (onOpponent): the first card they put
// from hand (Mosje / Piecie / Snelle / Place) after the guess decides it: correct +20 MP, wrong -10 MP.
// RULING FLAG: if they play no card before the end of their next turn, the guess counts as wrong.
// Registered under cardPlayedFromHand and endOfTurn; the guess lives on FPS West's slot (gone if he leaves).
import { gainMP, loseMP } from '../../engine/mpManager.js';

const TYPE_OF = { MOSJE: 'MOSJE', PIECIE: 'PIECIE', SNELLE_PIECIE: 'SNELLE', PLACE: 'PLACE' };

export const fpsWestTacticalAnalysis = {
	mosjeId: 'mosje_fps_west',
	onOpponent: true,
	run(state, ctx) {
		const slot = state.players[ctx.ownerId].activeSlots[ctx.holderSlotIndex];
		if (!slot.fpsWestGuess) return state;
		const correct = ctx.cardType !== undefined && TYPE_OF[ctx.cardType] === slot.fpsWestGuess;
		delete slot.fpsWestGuess;
		return correct
			? gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 20, 'ABILITY')
			: loseMP(state, ctx.ownerId, ctx.holderSlotIndex, 10, 'ABILITY', false, ctx.ownerId);
	},
};
