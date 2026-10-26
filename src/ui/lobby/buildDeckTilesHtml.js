// buildDeckTilesHtml.js — the one generic deck picker, as an escaped radiogroup (D-07, T-64-03).
// Used by every picker: your deck, the bot rows, Watch Bots rows, Phase 67 room screens. Each tile is one
// <button role="radio"> (whole tile = the control); roving tabindex: 0 on the selected tile (or the first), -1 on the rest.
// Hooks: data-deck-id and data-choice-id (the pick), --deck-color / --deck-tint (stack colour).
// Every interpolated value goes through escapeHtml; colours must also be hex, anything else falls back to the neutral tone.
import { escapeHtml } from '../cardV1/escapeHtml.js';

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const NEUTRAL_COLOR = '#B45309';
const NEUTRAL_TINT = '#FFEDD5';

export function buildDeckTilesHtml(specs, { label, compact = false } = {}) {
	const focusIndex = Math.max(0, specs.findIndex(spec => spec.selected));
	const tiles = specs.map((spec, index) => {
		const id = escapeHtml(spec.id);
		const color = escapeHtml(HEX_COLOR.test(spec.color) ? spec.color : NEUTRAL_COLOR);
		const tint = escapeHtml(HEX_COLOR.test(spec.tint) ? spec.tint : NEUTRAL_TINT);
		const classes = `deck-tile${spec.isRandom ? ' deck-tile--random' : ''}`;
		const details = compact
			? ''
			: `<span class="deck-tile__desc">${escapeHtml(spec.description)}</span>`
				+ (spec.startingMosjeName ? `<span class="deck-tile__mosje">Starts with ${escapeHtml(spec.startingMosjeName)}</span>` : '');
		return `<button type="button" class="${classes}" role="radio" aria-checked="${spec.selected ? 'true' : 'false'}" tabindex="${index === focusIndex ? 0 : -1}" data-choice-id="${id}" data-deck-id="${id}" style="--deck-color:${color};--deck-tint:${tint}"><span class="deck-tile__name">${escapeHtml(spec.name)}</span>${details}</button>`;
	});
	return `<div class="deck-tiles${compact ? ' deck-tiles--compact' : ''}" role="radiogroup" aria-label="${escapeHtml(label ?? '')}">${tiles.join('')}</div>`;
}
