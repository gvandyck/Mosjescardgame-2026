// stepPiecies - Piecies whose effect is a list of steps (rules/cardSteps.js) run by the one handler runCardSteps.
// One bound export per card, named as the card's effectId. Add a card: one line here + its entry in CARD_STEPS.
import { runCardSteps } from '../../engine/steps/runCardSteps.js';
import { pieceDef } from './pieceDef.js';

const stepCard = (cardId) => (state, playerId, ctx) => runCardSteps(state, playerId, pieceDef(cardId), ctx);

export const effect_kannetje_melk = stepCard('piecie_kannetje_melk');
export const effect_super_saiyan_mos = stepCard('piecie_super_saiyan_mos');
