// costKinds - registry: cost kind name -> { canPay(ctx, cost, choice) -> true | reason string, pay(ctx, cost, choice) }.
// ctx = { state, playerId, slotIndex (the paying Mosje), excludeCardId? }. Data only, no logic; kinds live in kinds/.
import { mpLossCost } from './kinds/mpLossCost.js';
import { energyCost } from './kinds/energyCost.js';
import { energyAnyCost } from './kinds/energyAnyCost.js';
import { discardReadyPiecieCost } from './kinds/discardReadyPiecieCost.js';
import { discardFromHandCost } from './kinds/discardFromHandCost.js';

export const COST_KINDS = Object.freeze({
	mpLoss: mpLossCost,
	energy: energyCost,
	energyAny: energyAnyCost,
	discardReadyPiecie: discardReadyPiecieCost,
	discardFromHand: discardFromHandCost,
});
