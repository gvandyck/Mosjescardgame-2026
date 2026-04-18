// eventBus.js — Lightweight internal pub/sub messaging.
// Lets engine and UI modules communicate without direct imports.
//
// Usage:
//   import { eventBus } from './eventBus.js';
//   eventBus.on('state:updated', handler);
//   eventBus.emit('state:updated', newState);
//   eventBus.off('state:updated', handler);

console.log('[SYNC] eventBus.js loaded');

function createEventBus() {
	/** @type {Map<string, Set<Function>>} */
	const handlers = new Map();

	function on(event, handler) {
		if (!handlers.has(event)) handlers.set(event, new Set());
		handlers.get(event).add(handler);
	}

	function off(event, handler) {
		handlers.get(event)?.delete(handler);
	}

	function emit(event, payload) {
		handlers.get(event)?.forEach(h => {
			try { h(payload); }
			catch (err) { console.error(`[EventBus] Handler error on "${event}":`, err); }
		});
	}

	function once(event, handler) {
		function wrapper(payload) {
			handler(payload);
			off(event, wrapper);
		}
		on(event, wrapper);
	}

	return { on, off, emit, once };
}

export const eventBus = createEventBus();
