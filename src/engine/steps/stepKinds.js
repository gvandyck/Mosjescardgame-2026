// stepKinds - registry: step `do` name -> { needsMosje(step) -> bool, run(state, playerId, step, env) -> state }.
// env = { cardDef, ctx, picked (slot index or -1), amount }. Push-only, like COST_KINDS; kinds live in kinds/.
import { gainMpStep } from './kinds/gainMpStep.js';
import { drawCardsStep } from './kinds/drawCardsStep.js';
import { powerStep } from './kinds/powerStep.js';
import { questDieStep } from './kinds/questDieStep.js';
import { shieldStep } from './kinds/shieldStep.js';

export const STEP_KINDS = Object.freeze({
	gainMp: gainMpStep,
	drawCards: drawCardsStep,
	power: powerStep,
	questDie: questDieStep,
	shield: shieldStep,
});
