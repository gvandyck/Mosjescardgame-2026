// renderRaiseDock.js — the DOM side of the phone tap-raise (Phase 65-06, D-10). Draws a raise view (createHandRaise's onView):
//   view null  -> the bar is back to its main mode, no hand card is marked, no "Place here", no Energy preview, the dock is empty;
//   view       -> the bar shows the dock (data-mode "raise"), the raised hand card is marked data-raised, the slot the engine will fill
//                 is marked gold (setSlotHint, only for a card that can be played) and the crystals preview the spend.
// Safe to call again for the same card after every render: the board rebuilds its slots and crystals each time, and this puts the
// hint, the preview and the mark back; the dock nodes are updated in place (a tap in flight is never swallowed). No engine calls.
import { setSlotHint } from '../board/setSlotHint.js';
import { setEnergyPreview } from '../board/setEnergyPreview.js';
import { buildRaiseDock } from './buildRaiseDock.js';
import { updateRaiseDock } from './updateRaiseDock.js';

export function renderRaiseDock(view, { bar, document: doc = document } = {}) {
	if (bar) bar.dataset.mode = view ? 'raise' : 'main';
	for (const wrap of doc.querySelectorAll('.hand-card-wrap[data-raised]')) wrap.removeAttribute('data-raised');
	const dock = bar?.querySelector('[data-raise-dock]');

	if (!view) {
		setSlotHint(doc, null);
		setEnergyPreview(doc, 0);
		dock?.replaceChildren();
		if (dock) delete dock.dataset.cardId;
		return;
	}

	[...doc.querySelectorAll('.hand-card-wrap')].find((wrap) => wrap.dataset.cardId === view.cardId)?.setAttribute('data-raised', '');
	if (dock) {
		if (dock.dataset.cardId === view.cardId) updateRaiseDock(dock, view);
		else buildRaiseDock(dock, view, doc);
	}
	const { canPlay, kind, slotIndex, cost } = view.info;
	setSlotHint(doc, canPlay && kind ? kind : null, slotIndex);
	setEnergyPreview(doc, canPlay ? cost : 0);
}
