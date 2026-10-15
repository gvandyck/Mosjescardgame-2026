// cloneState - deep copy of the game state for an effect to work on (effects never mutate their input).
export function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}
