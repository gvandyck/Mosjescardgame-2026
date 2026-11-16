// isLegalDeck - checks a deck definition against the 2.1 deck rule. Pure. Returns { ok, errors }.
// Counts the expanded entries of every list buildDeck reads ({ id, qty } or a plain id).
import { DECK_SIZE, MIN_PERSONAL_QUESTS } from './deckRules.js';

const LISTS = ['mosjes', 'piecies', 'snellePiecies', 'places', 'personalQuests'];

function countEntries(entries) {
	let n = 0;
	for (const entry of Array.isArray(entries) ? entries : []) {
		if (typeof entry === 'string') n += 1;
		else if (entry && entry.id) n += Number.isInteger(entry.qty) ? entry.qty : 1;
	}
	return n;
}

export function isLegalDeck(deckDef) {
	const errors = [];
	const size = LISTS.reduce((sum, key) => sum + countEntries(deckDef?.[key]), 0);
	if (size !== DECK_SIZE) errors.push(`A deck has ${DECK_SIZE} cards; this one has ${size}`);
	const quests = countEntries(deckDef?.personalQuests);
	if (quests < MIN_PERSONAL_QUESTS) errors.push(`A deck needs at least ${MIN_PERSONAL_QUESTS} Personal Quest; this one has ${quests}`);
	return { ok: errors.length === 0, errors };
}
