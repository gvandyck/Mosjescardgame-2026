// takeTargeted - reads and removes the Target record (state.targetedThisAction). Returns the list ([] when none).
// Mutates the state it is given.
export function takeTargeted(state) {
	const list = Array.isArray(state?.targetedThisAction) ? state.targetedThisAction : [];
	if (state) delete state.targetedThisAction;
	return list;
}
