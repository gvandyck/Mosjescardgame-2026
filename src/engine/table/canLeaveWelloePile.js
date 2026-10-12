// canLeaveWelloePile — Mosjes may leave the Welloe pile only via Mosje Reborn / Call of the Welloes,
// and not while Welloe Graveyard is the active Place (TABLE-06).
export function canLeaveWelloePile(state) {
	return state?.activePlace !== 'place_welloe_graveyard';
}
