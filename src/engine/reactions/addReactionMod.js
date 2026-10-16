// addReactionMod - pushes one one-shot entry onto state.reactionMods (mutates the given, already cloned, state).
export function addReactionMod(state, entry) {
	if (!Array.isArray(state.reactionMods)) state.reactionMods = [];
	state.reactionMods.push(entry);
}
