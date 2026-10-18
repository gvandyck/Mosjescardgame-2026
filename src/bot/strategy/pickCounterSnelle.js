// pickCounterSnelle - the bot's answer to what the OPPONENT just did: a Jensen!, a Piecie activation or a Quest roll
// (BOT-03). Returns a window id (a Snelle id, 'djReroll:i' or 'piecieReroll:i') or null to pass. Frenssen! answers a
// Jensen!; Jammertje Gepakt! cancels a costly / attack / Power / five-star Piecie; Gevalletje Klakkeloos copies a gain or
// draw Piecie (not five-star) that would do something for us; a winning opponent roll is rerolled (DJ / Piecie grant, then
// Je Weet Niet, then Lucky Coin). The activated Piecie is read from the window's own held action: it is face-up at the table.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { getCardEnergyCost } from '../../engine/energy/getCardEnergyCost.js';
import { getSnelleCost } from '../../engine/energy/getSnelleCost.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { heldPiecieDef } from '../../rules/heldPiecieDef.js';
import { FIVE_STARS, JAMMERTJE_MIN_COST } from './cardAmounts.js';
import { canBotAfford } from './canBotAfford.js';
import { getCardTags } from './comboTags.js';
import { isUsefulActivation } from './isUsefulActivation.js';
import { pickDjRerollDie } from './pickDjRerollDie.js';
import { asBotView } from './asBotView.js';

const BLENSEN = SNELLE_PIECIES.find(d => d.id === 'snelle_blensen');

export function pickCounterSnelle(state, responderId) {
	const view = asBotView(state, responderId); // BOT-04: from here on `view` is the table view
	const p = view.pendingReaction;
	if (!p || p.responderId !== responderId) return null;
	const moments = p.moments || [];
	const can = (id) => (p.eligible || []).includes(id) && canBotAfford(view, responderId, id, 'snelle');

	if (moments.includes('jensenPlayed')) {
		if (can('snelle_frenssen')) return 'snelle_frenssen';
		return can('snelle_blensen') && getSnelleCost(view, responderId, BLENSEN) === 0 ? 'snelle_blensen' : null;
	}

	if (moments.includes('afterPiecieActivation') && p.actorId !== responderId) {
		const def = heldPiecieDef(view, p.action);
		if (!def) return null;
		const tags = getCardTags(def.id);
		const fiveStar = def.rarity === FIVE_STARS;
		if (can('snelle_jammertje_gepakt') && (getCardEnergyCost(def.id) >= JAMMERTJE_MIN_COST || tags.includes('attack') || tags.includes('power') || fiveStar)) return 'snelle_jammertje_gepakt';
		const copies = !fiveStar && (tags.includes('mp-gain') || tags.includes('draw'));
		return can('snelle_gevalletje_klakkeloos') && copies && isUsefulActivation(view, responderId, def.id) ? 'snelle_gevalletje_klakkeloos' : null;
	}

	const roll = view.pendingQuestRoll;
	if (moments.includes('afterQuestRoll') && roll && roll.playerId !== responderId) {
		const flip = pickDjRerollDie(view, responderId, p.eligible) || pickDjRerollDie(view, responderId, p.eligible, 'piecieReroll:');
		if (flip) return flip;
		const quest = getQuestDef(roll.questId);
		if (!roll.win || !quest || quest.band === 'trained') return null; // a losing roll stays lost; a trained Quest never fails
		if (can('snelle_jeweetniet')) return 'snelle_jeweetniet';
		return can('snelle_lucky_coin') ? 'snelle_lucky_coin' : null;
	}
	return null;
}
