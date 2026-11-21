// pauseTitle — the title of the card-face choice modal for a state.pendingChoice (72-17).
// A known pause key gets its own title; any other pause uses its own prompt sentence, then a title by kind of choice.
// The bare word "Choose" is never the answer. Pure: no DOM, no state change.
const BY_KEY = {
	wizard_pick: 'Take 1 of the top 3 cards',
	fps_west_bottom: 'Put 1 card of their hand on the bottom of their deck',
	ming_activate: 'Activate the card Ming drew?',
	binti_discard_card: 'Discard 1 card',
	stook_discard: 'Discard 1 card',
	attach_mosje: 'Attach to which Mosje?',
	attach_replace: 'Replace which attached card?',
	cost_mosje: 'Which Mosje pays?',
};

const BY_KIND = {
	handCard: 'Choose a card from the list',
	discardCard: 'Choose one of your discarded cards',
	ownMosje: 'Choose one of your Mosjes',
	oppMosje: 'Choose an opponent Mosje',
	mosje: 'Choose a Mosje',
	welloeMosje: 'Choose a Mosje from the Welloe pile',
	ownPiecieSlot: 'Choose one of your Piecies',
	place: 'Choose a Place',
	die: 'Choose a die',
	cardName: 'Name a card',
	mpValue: 'Choose an MP value',
};

export function pauseTitle(pc) {
	return BY_KEY[pc?.key] || pc?.prompt || BY_KIND[pc?.choiceKind] || 'Make a choice';
}
