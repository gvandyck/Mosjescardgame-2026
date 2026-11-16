// durationKinds - the durations of rules §9. INSTANT is never stored; the other five live in state.timedEffects.
// Upkeep is not a duration: it is a card flag (def.upkeep) handled by runUpkeep.
export const DURATIONS = {
	INSTANT: 'instant',
	THIS_TURN: 'thisTurn',
	UNTIL_END_OF_NEXT_TURN: 'untilEndOfYourNextTurn',
	OPPONENT_NEXT_TURN: 'duringOpponentsNextTurn',
	WHILE_ATTACHED: 'whileAttached',
	WHILE_PLACE_STAYS: 'whilePlaceStays',
};

export const STORED_DURATIONS = Object.values(DURATIONS).filter(d => d !== DURATIONS.INSTANT);
