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
	let mirrorBuffer = null;

	function syncMirror() {
		if (mirrorBuffer) mirrorBuffer.value = lines.join('\n');
	}

	function add(type, message) {
		const row = document.createElement('div');
		row.className = `log-row ${type || 'system'}`;
		const icon = ICONS[type] || '•';
		row.textContent = `${icon} ${message}`;
		container.prepend(row);
		lines.unshift(`${icon} ${message}`);
		syncMirror();
		console.log('[UI] Log:', type, message);
	}

	function clear() {
		container.innerHTML = '';
		lines.length = 0;
		syncMirror();
		console.log('[UI] Log cleared');
	}

	function asText() {
		return lines.join('\n');
	}

	function attachBuffer(textareaEl) {
		mirrorBuffer = textareaEl || null;
		syncMirror();
	}

	return { add, clear, asText, attachBuffer };
}
