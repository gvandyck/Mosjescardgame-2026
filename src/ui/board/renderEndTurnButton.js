// renderEndTurnButton.js — writes the End Turn button of the middle strip (63-UI-SPEC "End Turn", D-11): the label, a small
// "N actions left" hint under it (only while N >= 1) and data-actions-left="N". The node itself is kept by main.js so its one
// click listener survives every render; this only rewrites its content. The label and hint are plain text (textContent).
export function renderEndTurnButton(button, actionsLeft = 0) {
	if (!button) return;
	const n = actionsLeft > 0 ? Math.floor(actionsLeft) : 0;
	button.dataset.actionsLeft = String(n);
	const hintText = n === 1 ? '1 action left' : `${n} actions left`;
	const label = button.querySelector('.end-turn__label');
	const hint = button.querySelector('.end-turn__hint');
	const unchanged = label && (n === 0 ? !hint : hint?.textContent === hintText);
	if (unchanged) return; // the same label and hint are already there: leave the DOM alone
	button.textContent = '';
	const labelEl = document.createElement('span');
	labelEl.className = 'end-turn__label';
	labelEl.textContent = 'End Turn';
	button.appendChild(labelEl);
	if (n > 0) {
		const hintEl = document.createElement('span');
		hintEl.className = 'end-turn__hint';
		hintEl.textContent = hintText;
		button.appendChild(hintEl);
	}
}
