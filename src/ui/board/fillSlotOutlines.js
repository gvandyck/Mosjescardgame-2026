// fillSlotOutlines.js — put the tiles of one kind in slot order and draw an empty outline for every missing slot,
// so a row always shows its full 2 Mosje / 3 Piecie slots (63-UI-SPEC "Board geometry").
// Tiles carry data-slot-kind + data-slot-index; anything else in the zone (e.g. the Place card, until it moves to the
// middle strip) keeps its place after the slots.
import { buildSlotOutlines } from './buildSlotOutlines.js';

export function fillSlotOutlines(zoneEl, kind, count) {
	if (!zoneEl) return;
	const all = [...zoneEl.children];
	const tiles = all.filter((el) => el.dataset.slotKind === kind);
	const bySlot = new Map(tiles.map((el) => [Number(el.dataset.slotIndex), el]));
	const ordered = [];
	for (let index = 0; index < count; index++) {
		if (bySlot.has(index)) { ordered.push(bySlot.get(index)); continue; }
		const holder = document.createElement('template');
		holder.innerHTML = buildSlotOutlines(kind, [index]);
		ordered.push(holder.content.firstElementChild);
	}
	const placed = new Set(ordered);
	zoneEl.replaceChildren(...ordered, ...all.filter((el) => !placed.has(el)));
}
