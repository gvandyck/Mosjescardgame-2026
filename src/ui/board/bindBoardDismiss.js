// bindBoardDismiss.js — the two ways out of a selection that are not a button (63-UI-SPEC "Interaction state machine"):
// the Esc key and a tap on empty felt (the board outside cards, Quest stacks, piles, buttons and the tray). Esc is left to
// an open modal. Bound once on the document; onDismiss is the controller's cancel.
const INTERACTIVE = '.card, .quest-stack, button, a, input, [data-pile], .discard-pile, .tile-badge, [data-action-tray], .board-toast';

export function bindBoardDismiss(getBoard, onDismiss) {
	if (typeof document === 'undefined') return;
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;
		if (document.getElementById('modal-root')?.classList.contains('modal-root--open')) return;
		onDismiss();
	});
	document.addEventListener('click', (event) => {
		const board = getBoard();
		const target = event.target;
		if (!board || !(target instanceof Element) || !document.contains(target)) return;
		const onFelt = board.contains(target) || target.matches('main.game-layout');
		if (onFelt && !target.closest(INTERACTIVE)) onDismiss();
	});
}
