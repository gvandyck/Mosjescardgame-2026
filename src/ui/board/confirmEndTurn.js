// confirmEndTurn.js — the End Turn safety net (63-UI-SPEC "End Turn", D-11): ask only when a Mosje can still act.
// confirmEndTurn(modal, actionsLeft) resolves true at once when nothing is left, otherwise shows the generic option modal in its
// big-row 'reaction' variant and resolves true only for "End turn". "Keep playing" is the way out (no cancel, no hover).
export async function confirmEndTurn(modal, actionsLeft) {
	if (!(actionsLeft > 0)) return true;
	const choice = await modal.showOptionSelect({
		title: 'End turn?',
		prompt: 'A Mosje can still act: end turn anyway?',
		options: [
			{ id: 'end', label: 'End turn' },
			{ id: 'keep', label: 'Keep playing' },
		],
		allowCancel: false,
		variant: 'reaction',
	});
	return choice === 'end';
}
