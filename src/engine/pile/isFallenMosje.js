// isFallenMosje - true for a pile entry that is a Mosje that went down on the field (source 'welloe').
// Such a card leaves the pile only through the Welloe-pile cards (Mosje Reborn, Call of the Welloes), never through
// a "discard pile" effect. A Mosje card that was discarded from a hand is not fallen.
export function isFallenMosje(entry) {
	return entry?.type === 'MOSJE' && entry.source === 'welloe';
}
