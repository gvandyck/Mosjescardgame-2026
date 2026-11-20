// getDeckTileLists.js — what a starter deck holds, as plain names for its lobby tile (72-12, D-14).
// Returns { theme, mosjeNames[], personalQuestNames[] } in deck order; an id that does not resolve is skipped.
// Mosje names read like the card list prints them: first name, nickname ("Alyssa, The Bulldozer").
import { MOSJES } from '../../data/mosjes.js';
import { PERSONAL_QUESTS } from '../../data/personalQuests.js';
import { parseMosjeName } from '../cardV1/parseMosjeName.js';

const nameOf = (list, id) => list.find(card => card.id === id)?.name;

export function getDeckTileLists(deck) {
	const mosjeNames = (deck?.mosjes ?? [])
		.map(id => nameOf(MOSJES, id))
		.filter(Boolean)
		.map(name => {
			const { firstName, nickname } = parseMosjeName(name);
			return nickname ? `${firstName}, ${nickname}` : firstName;
		});
	const personalQuestNames = (deck?.personalQuests ?? []).map(id => nameOf(PERSONAL_QUESTS, id)).filter(Boolean);
	return { theme: deck?.tagline ?? '', mosjeNames, personalQuestNames };
}
