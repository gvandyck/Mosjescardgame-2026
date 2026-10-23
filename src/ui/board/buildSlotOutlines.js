// buildSlotOutlines.js — HTML for the empty slot outlines of a board row (63-UI-SPEC "Board geometry").
// One inert dashed outline per missing slot index, so a row always shows 2 Mosje + 3 Piecie slots.
export function buildSlotOutlines(kind, indexes) {
	return (indexes || [])
		.map((index) => `<div class="board-slot board-slot--empty" data-slot-kind="${kind}" data-slot-index="${index}" aria-hidden="true"></div>`)
		.join('');
}
