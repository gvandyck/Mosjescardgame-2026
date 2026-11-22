// getCardSheetSections.js - the sections of the phone card sheet, in order, as plain data (72.1-06, D-06). Pure.
// data = what readCardSheetData returns. Order: type line, stats (Level / MP / Power), card text, attachments "n / max" with each
// name and short text, effects (the FULL timed-effect texts), panel lines (flavour, rarity, limit, reminder). A section with nothing
// to say is left out. The attachments line of the card panel is dropped here: it has its own section.
export function getCardSheetSections(data) {
	const sections = [{ id: 'type', text: data.typeLabel || 'Card' }];
	const items = [];
	if (Number.isFinite(data.level)) items.push(`Level ${data.level}`);
	if (Number.isFinite(data.mp)) items.push(`${data.mp} MP`);
	if (Number.isFinite(data.power)) items.push(`Power ${data.power}`);
	if (items.length) sections.push({ id: 'stats', items });
	if (data.text?.length) sections.push({ id: 'text', rows: data.text });
	if (data.attachments?.rows?.length) {
		sections.push({ id: 'attachments', title: `Attachments ${data.attachments.rows.length} / ${data.attachments.max}`, rows: data.attachments.rows });
	}
	if (data.tags?.length) sections.push({ id: 'effects', title: 'Effects', rows: data.tags });
	const panel = (data.panelLines || []).filter((line) => line.kind !== 'attachments');
	if (panel.length) sections.push({ id: 'panel', rows: panel });
	return sections;
}
