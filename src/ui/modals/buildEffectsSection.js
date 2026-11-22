// buildEffectsSection.js - the "Effects" section of the Mosje detail view as HTML (72.1-04, D-05): the timed effects, die marks and the
// shield of the tile (the tile tag lines, hidden on a phone). tags = the tile's [{ text, kind }]. '' when there are none. All text is escaped.
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function buildEffectsSection(tags) {
	const list = (Array.isArray(tags) ? tags : []).filter(t => t && typeof t.text === 'string' && t.text);
	if (!list.length) return '';
	return `<div class="cd-attach-count">Effects ${list.length}</div>${list.map(t => `<div class="cd-effect" data-kind="${escapeHtml(t.kind || 'effect')}">${escapeHtml(t.text)}</div>`).join('')}`;
}
