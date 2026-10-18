// getBotPaymentCost - what a payment really costs the bot RIGHT NOW (BOT-02): the printed cost after the Place
// discounts (Dierenasiel, Welloe Graveyard, Coert's Caravan) plus the Delluft parking fee. Pure: it asks the engine's
// own cost functions and never commits anything (the Caravan stays unused until the engine pays).
// kind: 'mosje' | 'place' (printed cost) | 'piecie' (an ACTIVATION; placing face-down is free) | 'snelle' |
// 'ability' (then cardId is the abilityId).
import { getCardEnergyCost } from '../../engine/energy/getCardEnergyCost.js';
import { getEffectiveCost } from '../../engine/energy/getEffectiveCost.js';
import { getSnelleCost } from '../../engine/energy/getSnelleCost.js';
import { delluftFee } from '../../engine/energy/delluftFee.js';
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { asBotView } from './asBotView.js';

export function getBotPaymentCost(state, botId, cardId, kind) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	let base;
	if (kind === 'snelle') {
		base = getSnelleCost(view, botId, SNELLE_PIECIES.find(s => s.id === cardId));
	} else if (kind === 'ability') {
		base = getEffectiveCost(view, botId, cardId, 'ability');
	} else if (kind === 'piecie') {
		// A Chain Reaction offer makes the next activation free (activatePiecie pays nothing then).
		base = (view.players?.[botId]?.chainReactionOffer ?? 0) > 0
			? 0
			: getEffectiveCost(view, botId, cardId, 'piecie', { caravan: true });
	} else {
		base = getCardEnergyCost(cardId);
	}
	return base + delluftFee(view, botId, base);
}
