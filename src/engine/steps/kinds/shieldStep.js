// shieldStep - "the picked Mosje loses N less MP each time it loses MP" while this Stays card lasts (D-03 MP shield).
// Fields: amount (friendAmount for a friend, see stepAmount), onlyOppTurn (counts only in the opponent's turn).
import { coverMosje } from '../../../abilities/piecie/coverMosje.js';

export const shieldStep = {
	needsMosje: () => true,
	run(state, playerId, step, { ctx, picked, amount }) {
		if (picked < 0) return state;
		return coverMosje(state, playerId, ctx, picked, amount, { onlyOppTurn: step.onlyOppTurn === true });
	},
};
