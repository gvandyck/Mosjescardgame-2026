// canBotAfford - can the bot pay this card/ability right now, after the Place discounts and the Delluft parking fee,
// and still keep `reserve` Energy back (a later plan holds Energy for a reaction Snelle)? A free payment is always affordable.
import { canPay } from '../../engine/energy/canPay.js';
import { asBotView } from './asBotView.js';
import { getBotPaymentCost } from './getBotPaymentCost.js';

export function canBotAfford(state, botId, cardId, kind, reserve = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const energy = Math.max(0, (view.players?.[botId]?.energy ?? 0) - reserve);
	return canPay({ energy }, getBotPaymentCost(view, botId, cardId, kind));
}
