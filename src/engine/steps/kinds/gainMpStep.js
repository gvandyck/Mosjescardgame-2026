// gainMpStep - the picked Mosje gains MP through the Piecie gain path (food extras included). Mutates nothing; returns a state.
import { gainFromPiecie } from '../../../abilities/piecie/gainFromPiecie.js';

export const gainMpStep = {
	needsMosje: () => true,
	run(state, playerId, step, { cardDef, picked, amount }) {
		if (picked < 0) return state;
		return gainFromPiecie(state, playerId, picked, amount, cardDef);
	},
};
