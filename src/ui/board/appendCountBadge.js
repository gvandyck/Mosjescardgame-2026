// appendCountBadge.js - draws the count badge of a Mosje tile (72.1-04, D-05): "2 gear, 1 effect" (compact "2+1" on a narrow tile).
// The chips and tag lines stay in the DOM; phone CSS hides them and shows this instead, desktop hides this (styles/phone-tiles.css).
// It reads the same public fields the chips and tags read. A tap opens the tile's Mosje detail (the opener is bound later, so it is
// read lazily). span role=button, not a <button>: no button sits inside a tile (board-cutover).
import { buildCountBadge } from './buildCountBadge.js';
import { bindCountBadgeTap } from './bindCountBadgeTap.js';
import { getAttachmentRows } from './getAttachmentRows.js';
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function appendCountBadge(cardEl, tile) {
	const badge = buildCountBadge({ attachments: getAttachmentRows(tile).rows.length, effects: Array.isArray(tile.tags) ? tile.tags.length : 0 });
	if (!badge) return;
	cardEl.insertAdjacentHTML('beforeend',
		`<div class="tile-count"><span class="tile-count-badge" role="button" tabindex="0" data-count-badge aria-label="${escapeHtml(badge.label)}. Opens the details">` +
		`<span class="tile-count-badge__full">${escapeHtml(badge.text)}</span><span class="tile-count-badge__compact">${escapeHtml(badge.compact)}</span></span></div>`);
	bindCountBadgeTap(cardEl, () => cardEl._boardOpenDetails?.());
}
