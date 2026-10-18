// choosePieciesToPlace - which Piecies from hand the bot places face-down this turn, best first (BOT-03). Placing is free,
// so the limit is slots: PIECIE_SLOT_COUNT minus the filled ones, minus one while a reaction Snelle is held for the
// opponent's turn (handoff 5 says "keep a slot free" without exceptions - even Chris's Perfect Setup gets no exemption).
// Order = slot competition: multipliers and MP gains claim slots first, then quest prep, Power boosts / attacks, draws.
import { PIECIE_SLOT_COUNT } from '../../engine/table/tableRules.js';
import { getCardTags } from './comboTags.js';
import { asBotView } from './asBotView.js';
import { reactionReserve } from './reactionReserve.js';

function playPriority(cardRef) {
	const tags = getCardTags(cardRef.cardId);
	if (tags.includes('multiplier')) return 0;
	if (tags.includes('mp-gain')) return 1;
	if (tags.includes('quest-prep')) return 2;
	if (tags.includes('attack') || tags.includes('power')) return 3;
	if (tags.includes('draw')) return 4;
	return 5;
}

export function choosePieciesToPlace(state, botId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const player = view.players?.[botId];
	const filled = (player?.piecieSlots || []).filter(Boolean).length;
	const room = Math.max(0, PIECIE_SLOT_COUNT - filled - (reactionReserve(view, botId).keepSlot ? 1 : 0));
	return (player?.hand || [])
		.filter(c => c.type === 'PIECIE')
		.sort((a, b) => playPriority(a) - playPriority(b))
		.slice(0, room);
}
