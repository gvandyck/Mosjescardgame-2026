// buildPopupCard.js - the hover dock's content for one hovered card (moved unchanged out of hoverZoom.js in 72.1-06).
// Rebuild a field card from its full definition + live MP/level/Power so the popup shows the ability text the art-first
// field card hides. Returns { card, panelHtml }: the panel (flavour, rarity, Limit 1 per deck, per-type reminder; D-09) hangs
// under the card inside the dock.
import { renderCard } from '../cardRenderer.js';
import { getCardById } from '../../data/cardIndex.js';
import { buildCardPanel } from '../cardV1/buildCardPanel.js';
import { readHook } from './readHook.js';

export function buildPopupCard(srcEl) {
	const cardId = srcEl.dataset.cardId;
	const def = getCardById(cardId);
	if (!def) return null;
	const merged = { ...def, description: def.abilityDescription || def.description || def.flavourText || '' };
	// 2.0 field tile: the live state is in its data-cv1-mp / data-cv1-level / data-cv1-power hooks
	// (the MP hook is the real MP even when a temp MP is shown on the tile).
	const live = { mp: readHook(srcEl, 'mp'), level: readHook(srcEl, 'level'), power: readHook(srcEl, 'power') };
	for (const [key, value] of Object.entries(live)) if (value !== null) merged[key] = value;
	// 72-05: the tile carries its attachment ids; the line is built from card data, the attribute is never inserted as HTML.
	const ids = (srcEl.dataset.attachments || '').split(',').filter(Boolean);
	const maxAttachments = Number(srcEl.dataset.maxAttachments);
	if (ids.length && Number.isFinite(maxAttachments)) {
		merged.attachments = ids.map(cardId => ({ cardId }));
		merged.maxAttachments = maxAttachments;
	}
	return { card: renderCard(merged, { compact: false }), panelHtml: buildCardPanel(merged) };
}
