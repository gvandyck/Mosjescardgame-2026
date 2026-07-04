// onboardingDeckPicker.js — Blocking first-login starter-deck picker.
// Pure UI-composition over the generic modalManager.showOptionSelect —
// no Firebase imports, no bespoke modal (CLAUDE.md reusable-selector rule).
// `decks` = the 5 player-facing duo decks from getPlayerFacingDecks().

// Prettify a mosje id: 'mosje_gandoe_destroyer' -> 'Gandoe Destroyer'.
function prettifyMosjeId(mosjeId) {
	return String(mosjeId)
		.replace(/^mosje_/, '')
		.split('_')
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

// Shows the blocking (allowCancel:false — no dismiss path) picker and
// resolves with the chosen deckId.
export async function showOnboardingDeckPicker(modal, decks) {
	const options = (Array.isArray(decks) ? decks : []).map(deck => ({
		id: deck.id,
		label: deck.name,
		metaLabel: (deck.mosjes ?? []).map(prettifyMosjeId).join(' &amp; '),
	}));
	return modal.showOptionSelect({
		title: 'Choose your starter deck',
		prompt: 'Pick one duo deck to begin. This is a one-time choice.',
		options,
		allowCancel: false,
		autoSelectSingle: false,
	});
}
