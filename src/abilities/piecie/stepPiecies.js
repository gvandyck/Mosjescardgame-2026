// stepPiecies - Piecies whose effect is a list of steps (rules/cardSteps.js) run by the one handler runCardSteps.
// One bound export per card, named as the card's effectId. Add a card: one line here + its entry in CARD_STEPS.
import { runCardSteps } from '../../engine/steps/runCardSteps.js';
import { pieceDef } from './pieceDef.js';

const stepCard = (cardId) => (state, playerId, ctx) => runCardSteps(state, playerId, pieceDef(cardId), ctx);

export const effect_kannetje_melk = stepCard('piecie_kannetje_melk');
export const effect_broodje_doner = stepCard('piecie_broodje_doner');
export const effect_protein_shake = stepCard('piecie_protein_shake');
export const effect_ronald_kip = stepCard('piecie_ronald_kip');
export const effect_hawaii_pizza = stepCard('piecie_hawaii_pizza');
export const effect_te_hard_gaan = stepCard('piecie_te_hard_gaan');
export const effect_ronalds_fles_fireman = stepCard('piecie_ronalds_fles_fireman');
export const effect_snoeiertje = stepCard('piecie_snoeiertje');
export const effect_super_saiyan_mos = stepCard('piecie_super_saiyan_mos');
export const effect_controller = stepCard('piecie_controller');
export const effect_dancepad = stepCard('piecie_dancepad');
