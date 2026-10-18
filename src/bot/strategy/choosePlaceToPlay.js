// choosePlaceToPlay - which Place from hand the bot plays now (or null): only on its own turn, never on a cooldown turn,
// never while a Place is in play, only one it can pay (fee included, `reserve` Energy kept back) and, for Tesla,
// only with a Coert on its field. Of those it takes the one that fits its board best (placeFit), and only when that
// beats 0: a Place that helps the opponent as much as the bot stays in hand. A tie goes to the earlier card in hand.
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { fieldHasMosjeNamed } from '../../engine/energy/fieldHasMosjeNamed.js';
import { asBotView } from './asBotView.js';
import { canBotAfford } from './canBotAfford.js';
import { placeFit } from './placeFit.js';

export function choosePlaceToPlay(state, botId, reserve = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	if (view.activePlayerId !== botId || isCooldownBlocked(view, botId) || view.activePlace) return null;
	const hand = view.players?.[botId]?.hand || [];
	let best = null;
	let bestFit = 0;
	for (const card of hand) {
		if (card.type !== 'PLACE' || !canBotAfford(view, botId, card.cardId, 'place', reserve)) continue;
		if (card.cardId === 'place_tesla' && !fieldHasMosjeNamed(view, botId, 'coert')) continue;
		const fit = placeFit(view, botId, card.cardId);
		if (fit > bestFit) { best = card; bestFit = fit; }
	}
	return best;
}
