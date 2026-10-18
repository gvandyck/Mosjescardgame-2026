// chooseProactiveSnelle - which Snelle without a reaction moment the bot casts from hand on its own turn (BOT-02), or null.
// Only when the engine would accept it (own turn, no cooldown, not blocked by Those Eyelashes, a free Piecie slot, a
// playable copy, the card's own Only-if met, payable with `reserve` Energy kept back) and only when it is worth more than 0:
//   Momentum Rush / Bijna Welloe  the gain on the best legal own Mosje (nothing under The Void, which blocks a Snelle gain)
//   Ff Haaltje Nemen              20 while the hand is nearly empty (3 or fewer other cards) and the deck still has a card
//   Jantje Jantje... Jantje?      the best opponent loss (non-fresh, not shielded) plus the best own gain, of 15 each
//   Chillingsvoorbij!             15 while no Place is in play (the Place it fetches is played this turn when it fits)
// Returns { cardId } of the most valuable one. Reads the table view only; the target pick is made by the driver's pause settling.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { mosjeOptions } from '../../abilities/snelle/pickMosje.js';
import { findPlayableHandIndex } from '../../engine/hand/findPlayableHandIndex.js';
import { voidBlocksGain } from '../../engine/mp/voidBlocksGain.js';
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { PIECIE_SLOT_COUNT } from '../../engine/table/tableRules.js';
import { snelleConditionMet } from '../../rules/snelleConditions.js';
import { asBotView } from './asBotView.js';
import { canBotAfford } from './canBotAfford.js';
import { valueOfGain } from './valueOfGain.js';
import { valueOfLoss } from './valueOfLoss.js';

const SNELLE_BY_ID = Object.fromEntries(SNELLE_PIECIES.map(s => [s.id, s]));
const DRAW_VALUE = 20;
const PLACE_BACK_VALUE = 15;
const NEARLY_EMPTY_HAND = 3;

export function chooseProactiveSnelle(state, botId, reserve = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const me = view.players?.[botId];
	if (view.activePlayerId !== botId || isCooldownBlocked(view, botId) || view._snelleBlocked === botId) return null;
	if ((me?.piecieSlots || []).filter(Boolean).length >= PIECIE_SLOT_COUNT) return null;

	// The best a gain of `amount` MP does for one of the bot's Mosjes the card may pick (`allow` narrows the pick).
	const bestGain = (amount, allow = () => true) => Math.max(0, ...mosjeOptions(view, botId, 'own', allow)
		.map(o => (voidBlocksGain(view, botId, o.slotIndex, 'SNELLE') ? 0 : valueOfGain(me.activeSlots[o.slotIndex], amount))));
	const bestHit = (amount) => Math.max(0, ...mosjeOptions(view, botId, 'opp')
		.map(o => valueOfLoss(view.players[o.playerId].activeSlots[o.slotIndex], amount)));
	const value = {
		snelle_momentum_rush: () => bestGain(15),
		snelle_bijna_welloe: () => bestGain(20, slot => slot.mp <= 10),
		snelle_ff_haaltje_nemen: () => ((me.hand.length - 1 <= NEARLY_EMPTY_HAND && (me.deck || []).length > 0) ? DRAW_VALUE : 0),
		snelle_jantje_jantje_jantje: () => bestHit(15) + bestGain(15),
		snelle_chillingsvoorbij: () => (view.activePlace ? 0 : PLACE_BACK_VALUE),
	};

	let best = null;
	let bestValue = 0;
	for (const card of me?.hand || []) {
		const def = SNELLE_BY_ID[card.cardId];
		if (!def || def.reactionMoments?.length || !value[def.id]) continue;
		if (findPlayableHandIndex(view, me.hand, c => c.cardId === def.id).index < 0) continue;
		if (snelleConditionMet(view, botId, def, null) !== true || !canBotAfford(view, botId, def.id, 'snelle', reserve)) continue;
		const worth = value[def.id]();
		if (worth > bestValue) { best = { cardId: def.id }; bestValue = worth; }
	}
	return best;
}
