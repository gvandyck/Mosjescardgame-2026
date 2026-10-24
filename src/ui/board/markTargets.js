// markTargets.js — marks what can be tapped while an Attack or a Quest is being chosen (63-UI-SPEC "Targeting", D-04..D-06).
// entries = [{ el, valid, short, reason, chip }]: each el gets data-target="valid" | "invalid"; an invalid one also gets its
// full reason (data-reason, shown in a toast by the tap) and a short badge word; `chip` is a floating number over a valid
// target ("−20" in the preview). The board gets data-mode so the CSS dims everything else. Texts go in as textContent.
function addLabel(el, className, text, attr) {
	const label = document.createElement('span');
	label.className = className;
	label.setAttribute(attr, '');
	label.textContent = text;
	el.appendChild(label);
}

export function markTargets(board, mode, entries) {
	if (!board) return;
	board.dataset.mode = mode;
	for (const { el, valid, short, reason, chip } of entries) {
		if (!el) continue;
		el.dataset.target = valid ? 'valid' : 'invalid';
		if (!valid && reason) el.dataset.reason = reason;
		if (!valid && short) addLabel(el, 'target-badge', short, 'data-target-badge');
		if (valid && chip) addLabel(el, 'target-chip', chip, 'data-target-chip');
	}
}
