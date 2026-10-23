// buildBoardSkeleton.js — the 2.0 board HTML (63-UI-SPEC "Board geometry"): opponent zone, middle strip, player zone.
// Every V4 container id is kept (zone-*, piecies-*, deck-*, discard-*, modifier-bar-*, quest-stacks); the rest are new hooks.
// Both rows use the same order (not mirrored): energy, Mosje slots, Piecie slots, then the piles.
import { escapeHtml } from '../cardV1/escapeHtml.js';

function zone(side, name) {
	return `
		<section class="board-zone board-zone--${side}" data-zone="${side}">
			<header class="board-zone__header">
				${escapeHtml(name)}
				<div class="snelle-modifier-bar" id="modifier-bar-${side}"></div>
			</header>
			<div class="board-zone__row">
				<div class="board-energy" id="energy-${side}"></div>
				<div class="board-zone__slots" id="zone-${side}"></div>
				<div class="board-zone__piecies" id="piecies-${side}"></div>
				<div class="pile-column">
					<div class="deck-pile-container" id="deck-${side}"></div>
					<div class="discard-pile-container" id="discard-${side}"></div>
					<div class="welloe-pile-container" id="welloe-${side}"></div>
				</div>
			</div>
		</section>`;
}

export function buildBoardSkeleton({ topName, bottomName } = {}) {
	return `${zone('opponent', topName ?? '')}
		<section class="board-middle" data-zone="middle">
			<div class="board-place" id="board-place"></div>
			<section class="quest-stacks" id="quest-stacks"></section>
			<div class="board-end-turn" id="board-end-turn"></div>
		</section>
		${zone('player', bottomName ?? '')}`;
}
