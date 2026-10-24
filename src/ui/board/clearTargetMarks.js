// clearTargetMarks.js — removes everything markTargets, the selection ring and the action tray put on the page, so the
// controller can redraw the current mode from scratch (the board's own re-render already starts clean).
export function clearTargetMarks(board) {
	for (const tray of document.querySelectorAll('[data-action-tray]')) tray.remove();
	if (!board) return;
	delete board.dataset.mode;
	for (const el of board.querySelectorAll('[data-target]')) {
		delete el.dataset.target;
		delete el.dataset.reason;
		delete el.dataset.preview;
	}
	for (const el of board.querySelectorAll('[data-target-badge], [data-target-chip]')) el.remove();
	for (const el of board.querySelectorAll('.is-selected')) el.classList.remove('is-selected');
}
