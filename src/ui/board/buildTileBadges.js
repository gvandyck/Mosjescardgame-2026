// buildTileBadges.js — the badge pills of a Mosje tile as HTML (63-UI-SPEC "Tile states", D-15, D-06).
// badges = getTileBadges output. Returns '' for none, else div.tile-badges holding one span.tile-badge per badge
// (data-badge = kind, data-reason = the full sentence, also the hover title). The pill is icon + word; a tap shows the reason
// (boardRenderer wires the click to the toast). The sideways pill gets tile-badge--centre. Every value goes through escapeHtml (T-63-06).
import { escapeHtml } from '../cardV1/escapeHtml.js';

const SVG = (inner) => `<svg class="tile-badge__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${inner}</svg>`;
const ICONS = {
	// four-point sparkle
	fresh: SVG('<path d="M8 1.2 9.6 6.4 14.8 8 9.6 9.6 8 14.8 6.4 9.6 1.2 8 6.4 6.4Z" fill="currentColor"/>'),
	// shield
	protected: SVG('<path d="M8 1.4 13.6 3.4V8c0 3.2-2.3 5.4-5.6 6.6C4.7 13.4 2.4 11.2 2.4 8V3.4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'),
	// crescent moon: asleep, skips a turn
	sideways: SVG('<path d="M12.6 10.4A5.6 5.6 0 0 1 5.6 3.4a5.6 5.6 0 1 0 7 7Z" fill="currentColor"/>'),
	// check mark
	acted: SVG('<path d="M3 8.4 6.6 12 13 4.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
};

export function buildTileBadges(badges) {
	if (!Array.isArray(badges) || badges.length === 0) return '';
	const pills = badges.map(({ kind, label, reason }) => {
		const k = escapeHtml(kind);
		const why = escapeHtml(reason);
		const centre = kind === 'sideways' ? ' tile-badge--centre' : '';
		return `<span class="tile-badge tile-badge--${k}${centre}" data-badge="${k}" data-reason="${why}" title="${why}" role="button" tabindex="0" aria-label="${escapeHtml(label)}: ${why}">${ICONS[kind] || ''}<span class="tile-badge__word">${escapeHtml(label)}</span></span>`;
	});
	return `<div class="tile-badges">${pills.join('')}</div>`;
}
