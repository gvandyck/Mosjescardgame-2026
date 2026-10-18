// placeFit - how much a Place helps the bot's board compared with the opponent's (BOT-02). Positive = play it.
// Three parts, all read from the table view: Power (the engine's own getPower with and without the Place), Quest dice
// (getQuestDiceCount for the best face-up Quest, a die is worth DIE_VALUE) and the card's Good for / Bad for words
// against the bot's own field. Fresh Mosjes ignore Places, so they count for nothing; defeated and sideways Mosjes neither.
import { MOSJES } from '../../data/mosjes.js';
import { PLACES } from '../../data/places.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getPower } from '../../engine/mp/getPower.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { getQuestDiceCount } from '../../engine/quests/getQuestDiceCount.js';
import { asBotView } from './asBotView.js';

const DIE_VALUE = 10;
const WORD_VALUE = 10;
const MOSJE_BY_ID = Object.fromEntries(MOSJES.map(m => [m.id, m]));
const PLACE_BY_ID = Object.fromEntries(PLACES.map(p => [p.id, p]));

const settled = (view, pid) => (view.players?.[pid]?.activeSlots || []).filter(s => s && !s.isDefeated && !isFresh(s));
const upright = (view, pid) => settled(view, pid).filter(s => !s.sideways);
const sum = (list, f) => list.reduce((total, x) => total + f(x), 0);

// Power the Place adds (or takes) over one side's settled Mosjes.
const powerDelta = (view, withPlace, pid) => sum(settled(view, pid), s => getPower(s, withPlace, pid) - getPower(s, view, pid));

// Extra Quest dice the Place gives one side: per upright Mosje, the best gain over the face-up Quests, a die worth DIE_VALUE.
function diceDelta(view, withPlace, pid, quests) {
	return DIE_VALUE * sum(upright(view, pid), s => Math.max(0, ...quests.map(q => getQuestDiceCount(withPlace, pid, s, q) - getQuestDiceCount(view, pid, s, q))));
}

// The words a Mosje answers to on a card: its type (Fighting, Digital, Artistic) and every word of its name, lower case.
function wordsOf(slot) {
	const def = MOSJE_BY_ID[slot.cardId];
	const name = String(def?.name ?? slot.name ?? '');
	return [String(def?.subtype ?? slot.subtype ?? '').toLowerCase(), ...name.toLowerCase().split(/[^a-z]+/)].filter(Boolean);
}

export function placeFit(state, botId, placeId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const def = PLACE_BY_ID[placeId];
	if (!def) return 0;
	const oppId = Object.keys(view.players || {}).find(id => id !== botId);
	const withPlace = { ...view, activePlace: placeId, activePlacePlayedBy: botId };
	const quests = Object.values(view.questStacks || {}).map(stack => getQuestDef(stack?.faceUp)).filter(Boolean);

	const power = powerDelta(view, withPlace, botId) - powerDelta(view, withPlace, oppId);
	const dice = diceDelta(view, withPlace, botId, quests) - diceDelta(view, withPlace, oppId, quests);
	const good = (def.goodFor || []).map(w => String(w).toLowerCase());
	const bad = (def.badFor || []).map(w => String(w).toLowerCase());
	// A fresh Mosje counts here: it ignores the Place only until its owner's next turn, the Place stays long after.
	const words = sum((view.players?.[botId]?.activeSlots || []).filter(s => s && !s.isDefeated), s => {
		const own = wordsOf(s);
		return (own.some(w => good.includes(w)) ? WORD_VALUE : 0) - (own.some(w => bad.includes(w)) ? WORD_VALUE : 0);
	});
	return power + dice + words;
}
