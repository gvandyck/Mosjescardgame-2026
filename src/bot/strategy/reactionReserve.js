// reactionReserve - what the bot keeps back for a reaction Snelle on the OPPONENT's turn (BOT-03, handoff 5): one free
// Piecie slot and the Energy of the cheapest such Snelle it holds. A reaction is played from a free slot, for Energy,
// while the opponent acts - so a bot that fills its slots and spends its Energy on its own turn can never answer.
// Only defender moments count: Snelle played on the bot's own turn (Sleutelpuntje, Dubbele Temminks) and proactive
// ones (no reaction moment) are cast in the turn's own flow and reserve nothing. Summons are exempt (caller's choice).
// No Delluft fee: the reserve is spent on the opponent's turn, where the fee never applies. A cooldown turn changes
// nothing either - the reserve is for the turn after it.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { REACTION_MOMENTS } from '../../engine/reactions/reactionMoments.js';
import { asBotView } from './asBotView.js';

const OWN_TURN_MOMENTS = [REACTION_MOMENTS.BEFORE_OWN_QUEST_ROLL, REACTION_MOMENTS.AFTER_OWN_QUEST_ROLL, REACTION_MOMENTS.AFTER_OWN_PIECIE_ACTIVATION];
const DEFENDER_MOMENTS = Object.values(REACTION_MOMENTS).filter(m => !OWN_TURN_MOMENTS.includes(m));
const SNELLE_BY_ID = Object.fromEntries(SNELLE_PIECIES.map(s => [s.id, s]));
const BLENSEN_ENERGY = 4; // Blensen! is "4 or free"; the free case needs a Jensen! this turn, which a held reserve can't count on

const printedCost = def => (def.id === 'snelle_blensen' ? BLENSEN_ENERGY : Number(def.cost) || 0);

/**
 * @param {object} state
 * @param {string} botId
 * @returns {{ keepSlot: boolean, energy: number, cardIds: string[] }}
 */
export function reactionReserve(state, botId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const held = [];
	for (const card of view.players?.[botId]?.hand || []) {
		const def = SNELLE_BY_ID[card?.cardId];
		if (def && !held.includes(def) && def.reactionMoments?.some(m => DEFENDER_MOMENTS.includes(m))) held.push(def);
	}
	return {
		keepSlot: held.length > 0,
		energy: held.length ? Math.min(...held.map(printedCost)) : 0,
		cardIds: held.map(def => def.id),
	};
}
