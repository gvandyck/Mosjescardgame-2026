// buildDeckTileListsHtml.js — the Mosje and Personal Quest lists inside a full deck tile (72-12, D-14).
// The tile is one <button>, so the lists are plain spans (no ul/li, nothing interactive). Every name is escaped (T-72-18).
import { escapeHtml } from '../cardV1/escapeHtml.js';

const list = (cls, heading, names) => (names?.length
	? `<span class="${cls}"><span class="deck-tile__heading">${heading}</span>${names.map(name => `<span class="deck-tile__item">${escapeHtml(name)}</span>`).join('')}</span>`
	: '');

export function buildDeckTileListsHtml(spec) {
	return list('deck-tile__mosjes', 'Mosjes', spec.mosjeNames) + list('deck-tile__quests', 'Personal Quests', spec.personalQuestNames);
}
