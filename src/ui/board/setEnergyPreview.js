// setEnergyPreview.js — the spend preview on MY Energy crystals (63-UI-SPEC, D-12): while a hand card is hovered or
// focused, the last `cost` full gems get data-crystal="spend" and the count reads "4/6 → 1/6". A cost the pool cannot
// cover marks no gem and reads "4/6 · need 5" (root data-preview="short"). cost 0 / null / NaN clears the preview.
// The crystals are redrawn on every board render, so there is nothing to undo besides this call.
export function setEnergyPreview(root, cost) {
	const crystals = root?.querySelector?.('#energy-player .energy-crystals');
	if (!crystals) return;
	const energy = Number(crystals.dataset.energy) || 0;
	const max = Number(crystals.dataset.energyMax) || 6;
	const count = crystals.querySelector('.energy-count');
	const spend = Math.trunc(Number(cost)) || 0;

	for (const gem of crystals.querySelectorAll('.energy-gem[data-crystal="spend"]')) gem.dataset.crystal = 'full';
	delete crystals.dataset.preview;
	if (spend <= 0) {
		if (count) count.textContent = `${energy}/${max}`;
		return;
	}
	if (spend > energy) {
		crystals.dataset.preview = 'short';
		if (count) count.textContent = `${energy}/${max} · need ${spend}`;
		return;
	}
	const full = [...crystals.querySelectorAll('.energy-gem[data-crystal="full"]')];
	for (const gem of full.slice(full.length - spend)) gem.dataset.crystal = 'spend';
	crystals.dataset.preview = 'spend';
	if (count) count.textContent = `${energy}/${max} → ${energy - spend}/${max}`;
}
