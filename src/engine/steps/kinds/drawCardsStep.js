// drawCardsStep - the activator draws `count` cards (empty deck draws nothing). Needs no Mosje.
import { drawFromEffect } from '../../turn/drawFromEffect.js';

export const drawCardsStep = {
	needsMosje: () => false,
	run(state, playerId, step) {
		return drawFromEffect(state, playerId, step.count ?? 1);
	},
};
