// choosePlaceToPlay - which Place from hand the bot plays now (or null): only on its own turn, never on a cooldown turn,
// never while a Place is in play, only one it can pay (fee included, `reserve` Energy kept back) and, for Tesla,
// only with a Coert on its field. First match in hand order (a later plan scores how well a Place fits).
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { fieldHasMosjeNamed } from '../../engine/energy/fieldHasMosjeNamed.js';
import { asBotView } from './asBotView.js';
import { canBotAfford } from './canBotAfford.js';

export function choosePlaceToPlay(state, botId, reserve = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	if (view.activePlayerId !== botId || isCooldownBlocked(view, botId) || view.activePlace) return null;
	const hand = view.players?.[botId]?.hand || [];
	return hand.find(c => c.type === 'PLACE'
		&& canBotAfford(view, botId, c.cardId, 'place', reserve)
		&& (c.cardId !== 'place_tesla' || fieldHasMosjeNamed(view, botId, 'coert'))) ?? null;
}
