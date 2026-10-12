// escapeMeta — showOptionSelect inserts metaLabel as raw HTML (labels/titles are escaped), so escape it here (T-56-13).
export function escapeMeta(text) {
	return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
