// chooseSummon - which Mosje from hand the bot summons this turn (or null). Summoning costs Energy (2.0 TABLE-01),
// so only affordable ones count, fee included; no reserve - summons stay exempt from the reaction reserve.
// Order: strongest first (higher Energy cost, then higher start MP); a 0 MP Mosje (Alyssa, The Bulldozer) only when
// nothing else is affordable. Nothing on a cooldown turn, with a full field, or off the bot's turn.
import { MOSJES } from '../../data/mosjes.js';
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { MAX_FIELD_MOSJES } from '../../engine/table/tableRules.js';
import { asBotView } from './asBotView.js';
import { canBotAfford } from './canBotAfford.js';

const DEFS = Object.fromEntries(MOSJES.map(m => [m.id, m]));

export function chooseSummon(state, botId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	if (view.activePlayerId !== botId || isCooldownBlocked(view, botId)) return null;
	const player = view.players?.[botId];
	const slots = [...(player?.activeSlots || [])];
	while (slots.length < MAX_FIELD_MOSJES) slots.push(null); // the engine pads the field the same way
	if (!slots.some(s => s === null) || slots.filter(Boolean).length >= MAX_FIELD_MOSJES) return null;
	const mp = c => DEFS[c.cardId]?.startMP ?? 0;
	const cost = c => DEFS[c.cardId]?.cost ?? 0;
	const options = (player?.hand || [])
		.filter(c => c.type === 'MOSJE' && DEFS[c.cardId] && canBotAfford(view, botId, c.cardId, 'mosje'))
		.sort((a, b) => (mp(a) === 0) - (mp(b) === 0) || cost(b) - cost(a) || mp(b) - mp(a));
	return options[0] ?? null;
}
