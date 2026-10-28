// setSlotHint.js — the "Place here" marker (64.1 D-02 / D-06). Same shape as setEnergyPreview: root = document, it clears
// first, so it is safe to call again. Marks ONE empty slot of MY row (never the opponent's) with data-place-here and a
// "Place here" label, or clears every mark (kind null). The slot stays inert (pointer-events none in the CSS): the engine
// fills the first free slot and has no chosen-slot play, so the slot is a signpost, not a button.
// The label text goes in as textContent; nothing from card data reaches the markup.
const OWN_ROW = { mosje: '#zone-player', piecie: '#piecies-player' };

function clearHint(root) {
	for (const slot of root.querySelectorAll('[data-place-here]')) slot.removeAttribute('data-place-here');
	for (const label of root.querySelectorAll('[data-place-here-label]')) label.remove();
}

export function setSlotHint(root, kind, slotIndex) {
	if (!root?.querySelectorAll) return false;
	clearHint(root);
	if (!OWN_ROW[kind] || !Number.isInteger(slotIndex) || slotIndex < 0) return false;
	const slot = root.querySelector(`${OWN_ROW[kind]} .board-slot--empty[data-slot-kind="${kind}"][data-slot-index="${slotIndex}"]`);
	if (!slot) return false;
	slot.setAttribute('data-place-here', '');
	const label = (root.ownerDocument || root).createElement('span');
	label.className = 'board-slot__hint';
	label.setAttribute('data-place-here-label', '');
	label.textContent = 'Place here';
	slot.appendChild(label);
	return true;
}
