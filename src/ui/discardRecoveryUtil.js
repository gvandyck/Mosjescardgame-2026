// discardRecoveryUtil.js — Utility for recovering cards from discard pile.
// Provides reusable openDiscardRecovery() function for effects.

console.log('[UI] discardRecoveryUtil.js loaded');

let _modalManager = null;

// Initialize with modal manager instance (called from main game loop)
export function setDiscardRecoveryModalManager(modalManager) {
	_modalManager = modalManager;
}

// Main recovery API: call this from quest effects or other game events.
// Returns a promise that resolves with the selected card IDs.
// config:
//   - playerId: whose discard to pull from
//   - playerName: display name for UI
//   - discardCards: array of card IDs in the discard
//   - count: how many cards to select
//   - destination: "hand" | "deck" | "field-facedown"
//   - filter: "piecie" | "snelle" | "mosje" | null (for filtering card types)
//   - onRecoveryComplete: callback(selectedIds, destination) after cards confirmed
export async function openDiscardRecovery({
	playerId = null,
	playerName = 'Player',
	discardCards = [],
	count = 1,
	destination = 'hand',
	filter = null,
	onRecoveryComplete = null,
} = {}) {
	if (!_modalManager) {
		console.warn('[Recovery] Modal manager not initialized');
		return null;
	}

	console.log(`[Recovery] Opening recovery modal: count=${count}, destination=${destination}, filter=${filter}`);

	const selectedIds = await _modalManager.showDiscardRecoveryModal({
		playerName,
		discardCards,
		requiredCount: count,
		filter,
		onRecover: (selected) => {
			if (selected && typeof onRecoveryComplete === 'function') {
				onRecoveryComplete(selected, destination, playerId);
			}
		},
	});

	return selectedIds;
}

// Utility for handling card placement after recovery.
// This is called by game handlers to move cards to their destination.
export function placeRecoveredCards(selectedCardIds, destination, player) {
	if (!Array.isArray(selectedCardIds) || selectedCardIds.length === 0) {
		console.log('[Recovery] No cards selected');
		return false;
	}

	console.log(`[Recovery] Placing ${selectedCardIds.length} cards to ${destination}`);

	// The actual placement logic happens in the game engine via the main game loop.
	// This utility just prepares the data and logging.
	// Return true to indicate success; game state handlers will process the changes.

	switch (destination) {
		case 'hand':
			console.log(`[Recovery] Adding to hand: ${selectedCardIds.join(', ')}`);
			return true;
		case 'deck':
			console.log(`[Recovery] Adding to deck (will shuffle): ${selectedCardIds.join(', ')}`);
			return true;
		case 'field-facedown':
			console.log(`[Recovery] Adding to field face-down: ${selectedCardIds.join(', ')}`);
			return true;
		default:
			console.warn(`[Recovery] Unknown destination: ${destination}`);
			return false;
	}
}
