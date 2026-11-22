// openCardSheet.js - opens the phone card sheet for one card element (72.1-06, D-06): a table card, the Place tile, a Quest stack or a hand
// card wrapper. It shows what only the desktop hover dock showed (type, Level / MP / Power, attachments n / max, the full timed-effect
// texts, the card panel) and a "Full card" button for the big centred detail view. onFullCard defaults to the tile's own detail opener
// (srcEl._boardOpenDetails, set by bindTileTap). Returns the sheet, or null when the card is unknown.
import { createBottomSheet } from './createBottomSheet.js';
import { readCardSheetData } from './readCardSheetData.js';
import { buildCardSheetContent } from './buildCardSheetContent.js';

export function openCardSheet(srcEl, { onFullCard } = {}) {
	const data = readCardSheetData(srcEl);
	if (!data) return null;
	const openFull = onFullCard || (() => srcEl._boardOpenDetails?.());
	const sheet = createBottomSheet({
		title: data.name,
		content: buildCardSheetContent(data),
		actions: [{ label: 'Full card', onClick: openFull }],
	});
	sheet.open();
	return sheet;
}
