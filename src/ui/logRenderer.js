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
		};
	}

	function add(type, message) {
		const row = document.createElement('div');
		row.className = `log-row ${type || 'system'}`;
		const icon = ICONS[type] || '•';
		row.textContent = `${icon} ${message}`;
		container.prepend(row);
		console.log('[UI] Log:', type, message);
	}

	function clear() {
		container.innerHTML = '';
		console.log('[UI] Log cleared');
	}

	return { add, clear };
}
