// parseSheetTags.js - the tile's data-tags attribute (JSON [{ text, kind }], set through dataset by boardRenderer) as a clean list (72.1-06).
// Junk or missing JSON gives []; entries without text are dropped; text is kept as a string (it is only ever shown through textContent).
export function parseSheetTags(raw) {
	if (typeof raw !== 'string' || !raw) return [];
	try {
		const list = JSON.parse(raw);
		if (!Array.isArray(list)) return [];
		return list.filter((t) => t && typeof t.text === 'string' && t.text).map((t) => ({ text: t.text, kind: typeof t.kind === 'string' ? t.kind : 'effect' }));
	} catch {
		return [];
	}
}
