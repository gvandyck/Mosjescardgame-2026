// isUsefulActivation - would activating this Piecie right now do anything for the bot? False for a Piecie whose effect
// would fizzle or hurt the bot for nothing: a Power boost with no Mosje left to attack, an MP gain nobody can receive
// (The Void, every Mosje at Level 3 / 95), a hit with no legal target, destroying the bot's OWN Place, a self-loss
// that would knock a Mosje out. Everything else (unknown cards too) is useful. The engine gate (Jeffrey, Level 2,
// "Only if") and Energy are separate: planPiecieActivations asks piecieActivationGate and the budget.
import { GIVES_MP_PIECIES } from '../../rules/givesMpPiecies.js';
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isValidAttackTarget } from '../../engine/actions/isValidAttackTarget.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { voidBlocksGain } from '../../engine/mp/voidBlocksGain.js';
import { mosjeOptions } from '../../abilities/snelle/pickMosje.js';
import { getCardTags } from './comboTags.js';
import { SELF_LOSS_MP, ELIMINATION_MP_MAX } from './cardAmounts.js';
import { valueOfGain } from './valueOfGain.js';
import { asBotView } from './asBotView.js';

const GAIN_PROBE = 15; // the smallest MP gain on a Piecie text
// A Piecie that also does one of these stays worth activating when no Mosje can gain MP (its gain is a side effect).
const MORE_THAN_GAIN = ['draw', 'attack', 'power', 'defense'];

const upright = (view, id) => (view.players?.[id]?.activeSlots || []).filter(s => s && !s.isDefeated);

// A Power boost needs a Mosje that may attack (one action, not fresh) and an opponent Mosje it may hit.
function canStillAttack(view, botId) {
	const rivals = Object.keys(view.players).filter(id => id !== botId);
	return (view.players[botId]?.activeSlots || []).some((slot, i) => slot && canMosjeTakeAction(view, botId, i).ok && !isFresh(slot)
		&& rivals.some(id => (view.players[id].activeSlots || []).some((_, j) => isValidAttackTarget(view, botId, id, j))));
}

// Some own Mosje can still gain MP (not capped at Level 3 / 95, not blocked by The Void).
function canGain(view, botId) {
	return (view.players[botId]?.activeSlots || []).some((slot, i) => valueOfGain(slot, GAIN_PROBE) > 0 && !voidBlocksGain(view, botId, i, 'PIECIE'));
}

// A hit needs an opponent Mosje the cards may target (not fresh, not Blensen!-shielded), at the MP an elimination asks.
function hasTarget(view, botId, cardId) {
	const maxMp = ELIMINATION_MP_MAX[cardId] ?? Infinity;
	return mosjeOptions(view, botId, 'opp', slot => (Number(slot.mp) || 0) <= maxMp).length > 0;
}

export function isUsefulActivation(state, botId, cardId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const tags = getCardTags(cardId);
	if (tags.includes('power') && !canStillAttack(view, botId)) return false;
	if (GIVES_MP_PIECIES.has(cardId) && !tags.some(t => MORE_THAN_GAIN.includes(t)) && !canGain(view, botId)) return false;
	if (tags.includes('attack') && !hasTarget(view, botId, cardId)) return false;
	if (tags.includes('place-destroy') && (!view.activePlace || view.activePlacePlayedBy === botId)) return false;
	if (tags.includes('self-loss') && !upright(view, botId).some(s => (Number(s.mp) || 0) - (SELF_LOSS_MP[cardId] ?? 0) > 0)) return false;
	return true;
}
