// logRenderer.js — Manages the scrollable game log side panel.
// Appends messages with emoji prefixes: ⚔️ attack, 🎯 quest, 💥 MP gain, etc.
// Filled in Phase 5.

console.log('[UI] logRenderer.js loaded');

const ICONS = {
	attack: '⚔️',
	quest: '🎯',
	gain: '💥',
	loss: '📉',
	level: '⬆️',
	win: '🏆',
	info: 'ℹ️',
};

export function createLogRenderer(container) {
	if (!container) {
		return {
			add: () => {},
			clear: () => {},
			asText: () => '',
			attachBuffer: () => {},
		};
	}

	const lines = [];
	const entries = []; // structured mirror of `lines`: { type, text } (newest-first)
	let mirrorBuffer = null;

	function syncMirror() {
		if (mirrorBuffer) mirrorBuffer.value = lines.join('\n');
	}

	function add(type, message) {
		const rowType = type || 'system';
		const icon = ICONS[type] || '•';
		const line = `${icon} ${message}`;
		const row = document.createElement('div');
		row.className = `log-row ${rowType}`;
		row.textContent = line;
		container.prepend(row);
		lines.unshift(line);
		entries.unshift({ type: rowType, text: line });
		syncMirror();
		console.log('[UI] Log:', type, message);
	}

	function clear() {
		container.innerHTML = '';
		lines.length = 0;
		entries.length = 0;
		syncMirror();
		console.log('[UI] Log cleared');
	}

	function asText() {
		return lines.join('\n');
	}

	// Structured copy of the log (newest-first), for rendering the battle log
	// inside the end-of-game reward overlay.
	function getEntries() {
		return entries.map(e => ({ ...e }));
	}

	function attachBuffer(textareaEl) {
		mirrorBuffer = textareaEl || null;
		syncMirror();
	}

	return { add, clear, asText, getEntries, attachBuffer };
}
