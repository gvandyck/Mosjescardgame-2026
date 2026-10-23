// buildEnergyCrystals.js — the Energy crystal column of one player's row (63-UI-SPEC "Energy crystals", D-12, UI-02).
// Always 6 gems, filled from the first one, never a 7th; the count "4/6" under them. The root exposes data-energy and
// data-energy-max, every gem data-crystal="full|empty". Against prevEnergy, the gems that were just gained carry
// data-crystal-anim="gain" (--i = stagger step) and the gems just spent carry data-crystal-anim="spend" (empty now).
// A gem is two stacked inline SVGs (outline + fill) so the fill can grow from the bottom without touching the outline.
import { ENERGY_MAX } from '../../engine/energy/energyRules.js';

const HEXAGON = '11,0.5 21.5,6 21.5,15 11,20.5 0.5,15 0.5,6';
const FACET = '11,0.5 21.5,6 11,10.5 0.5,6';
const GEM_SVG = `<svg class="energy-gem__base" viewBox="0 0 22 21" aria-hidden="true"><polygon points="${HEXAGON}"/></svg>`
	+ `<svg class="energy-gem__fill" viewBox="0 0 22 21" aria-hidden="true"><polygon points="${HEXAGON}"/><polygon class="energy-gem__facet" points="${FACET}"/></svg>`;

function clampEnergy(value) {
	const n = Math.trunc(Number(value));
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.min(ENERGY_MAX, n));
}

function buildGem(index, energy, prev) {
	const full = index < energy;
	let anim = '';
	if (prev !== null && energy > prev && index >= prev && index < energy) {
		anim = ` data-crystal-anim="gain" style="--i:${index - prev}"`;
	} else if (prev !== null && energy < prev && index >= energy && index < prev) {
		anim = ' data-crystal-anim="spend"';
	}
	return `<i class="energy-gem" data-crystal="${full ? 'full' : 'empty'}"${anim}>${GEM_SVG}</i>`;
}

export function buildEnergyCrystals({ energy, prevEnergy } = {}) {
	const now = clampEnergy(energy);
	const hasPrev = prevEnergy !== undefined && prevEnergy !== null && Number.isFinite(Number(prevEnergy));
	const prev = hasPrev ? clampEnergy(prevEnergy) : null;
	const gems = Array.from({ length: ENERGY_MAX }, (_, index) => buildGem(index, now, prev)).join('');
	return `<div class="energy-crystals" data-energy="${now}" data-energy-max="${ENERGY_MAX}" role="img" aria-label="Energy ${now} of ${ENERGY_MAX}">${gems}<span class="energy-count">${now}/${ENERGY_MAX}</span></div>`;
}
