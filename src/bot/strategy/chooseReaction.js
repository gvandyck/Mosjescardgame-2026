// chooseReaction — the bot's answer to state.pendingReaction: a window id (Snelle cardId, 'djReroll:i', 'piecieReroll:i')
// or null to pass. The bot's OWN windows are decided here (Sleutelpuntje, DJ / Piecie rerolls, Lucky Coin, Dubbele
// Temminks); the opponent's actions go to pickDefensiveSnelle (a Mosje in trouble) and pickCounterSnelle (a Piecie,
// a Quest roll, a Jensen!). Every Snelle must be affordable now (Place discounts and the Delluft fee included).
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { getQuestDiceCount } from '../../engine/quests/getQuestDiceCount.js';
import { heldPiecieDef } from '../../rules/heldPiecieDef.js';
import { FIVE_STARS } from './cardAmounts.js';
import { canBotAfford } from './canBotAfford.js';
import { getCardTags } from './comboTags.js';
import { isUsefulActivation } from './isUsefulActivation.js';
import { pickCounterSnelle } from './pickCounterSnelle.js';
import { pickDefensiveSnelle } from './pickDefensiveSnelle.js';
import { pickDjRerollDie } from './pickDjRerollDie.js';
import { asBotView } from './asBotView.js';

const DEFENDER_MOMENTS = ['targeted', 'wouldLoseMp', 'attacked', 'toWelloe'];

// Dubbele Temminks repeats an own gain or draw Piecie that is not five-star, when the repeat would do something.
function worthRepeating(view, responderId, action) {
	const def = heldPiecieDef(view, action);
	if (!def || def.rarity === FIVE_STARS) return false;
	const tags = getCardTags(def.id);
	return (tags.includes('mp-gain') || tags.includes('draw')) && isUsefulActivation(view, responderId, def.id);
}

export function chooseReaction(state, responderId) {
	state = asBotView(state, responderId); // BOT-04: from here on `state` is the table view
	const p = state.pendingReaction;
	if (!p || p.responderId !== responderId) return null;
	const at = (moment) => p.moments.includes(moment);
	const can = (id) => p.eligible.includes(id) && canBotAfford(state, responderId, id, 'snelle');
	if (at('beforeOwnQuestRoll')) {
		const { slotIndex, stackId } = p.action.args[1] || {};
		const slot = state.players[responderId]?.activeSlots?.[slotIndex];
		const quest = getQuestDef(state.questStacks?.[stackId]?.faceUp);
		return can('snelle_sleutelpuntje') && slot && quest && getQuestDiceCount(state, responderId, slot, quest) < 4 ? 'snelle_sleutelpuntje' : null;
	}
	if (at('afterOwnQuestRoll')) {
		const reroll = pickDjRerollDie(state, responderId, p.eligible) || pickDjRerollDie(state, responderId, p.eligible, 'piecieReroll:'); // DJ Lucky Beats, Piecie grant (Dubbele Dosis)
		if (reroll) return reroll;
		return can('snelle_lucky_coin') && state.pendingQuestRoll?.win === false ? 'snelle_lucky_coin' : null;
	}
	if (at('afterOwnPiecieActivation')) return can('snelle_dubbele_temminks') && worthRepeating(state, responderId, p.action) ? 'snelle_dubbele_temminks' : null;
	if (DEFENDER_MOMENTS.some(at)) {
		const defence = pickDefensiveSnelle(state, responderId);
		if (defence) return defence;
	}
	return pickCounterSnelle(state, responderId);
}
