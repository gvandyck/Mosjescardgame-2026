// getPlaceTint.js — the felt wash colour for an active Place (63-UI-SPEC "Place tile and felt tint", D-10).
// A Place that is good for exactly ONE Quest stack (Fighting / Digital / Artistic) takes that stack's colour;
// a Place good for none or for several stacks gets the neutral warm tone. Other goodFor entries (Mosje names,
// decks, "Questers") are ignored. No new data field: it only reads place.goodFor.
import { QUEST_STACK_IDS } from '../../engine/setup/setupRules.js';
import { TYPE_COLORS } from '../cardV1/typeColors.js';

const NEUTRAL_TINT = '#B45309';

export function getPlaceTint(place) {
	const goodFor = Array.isArray(place?.goodFor) ? place.goodFor : [];
	const stacks = new Set();
	for (const entry of goodFor) {
		const key = String(entry ?? '').trim().toUpperCase();
		if (QUEST_STACK_IDS.includes(key)) stacks.add(key);
	}
	if (stacks.size !== 1) return NEUTRAL_TINT;
	return TYPE_COLORS[[...stacks][0]].main;
}
