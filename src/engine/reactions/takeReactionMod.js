// takeReactionMod - removes and returns the first one-shot reaction entry (state.reactionMods) of `kind` bound to this
// Mosje slot (slotIndex null on the entry = any slot of that player). Mutates the given, already cloned, state.
// Entries: { kind: 'reduce', amount } | { kind: 'gainFirst', amount } | { kind: 'save' }, each with playerId + slotIndex.
export function takeReactionMod(state, kind, playerId, slotIndex) {
	const mods = state?.reactionMods;
	if (!Array.isArray(mods)) return null;
	const i = mods.findIndex(m => m.kind === kind && m.playerId === playerId && (m.slotIndex == null || m.slotIndex === slotIndex));
	if (i < 0) return null;
	const [entry] = mods.splice(i, 1);
	return entry;
}
