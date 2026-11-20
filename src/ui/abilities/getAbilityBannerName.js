// getAbilityBannerName.js — the text of the ability activation banner (72-10, D-11).
// A real abilityName from the data, else "<First name> ability". Never a clause cut from the ability text.
import { parseMosjeName } from '../cardV1/parseMosjeName.js';

export function getAbilityBannerName(def) {
	if (!def) return 'Ability';
	const named = String(def.abilityName || '').trim();
	if (named) return named;
	return `${parseMosjeName(def.name).firstName} ability`;
}
