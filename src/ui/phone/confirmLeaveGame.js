// confirmLeaveGame.js — the "Leave the game?" confirm of the Back guard (72.1-10, D-04). Same big-row option sheet as confirmEndTurn;
// no cancel, so "Keep playing" is the way out. Resolves 'keep' or 'leave'.
export async function confirmLeaveGame(modal) {
	const choice = await modal.showOptionSelect({
		title: 'Leave the game?',
		prompt: 'Your game is still running. Going back ends it.',
		options: [
			{ id: 'keep', label: 'Keep playing' },
			{ id: 'leave', label: 'Leave' },
		],
		allowCancel: false,
		variant: 'reaction',
	});
	return choice === 'leave' ? 'leave' : 'keep';
}
