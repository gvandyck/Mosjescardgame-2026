// renderPlaceTile.js — the Place tile on the left of the middle strip (63-UI-SPEC "Place tile", D-08, D-07).
// An active Place is drawn as the field-mode Place card (no slot is used) with an owner chip "YOU · 2 turns" / "BOT · 1 turn"
// and data-place-owner = the owner's player id. A tap calls onTap(place) (default: the detail view); the detail view itself
// (openDetails(place)) is also kept on the tile for the action tray's Details chip. No Place in play = a dashed outline.
import { renderCard } from '../cardRenderer.js';
import { getCardById } from '../../data/cardIndex.js';
import { formatPlaceOwnerChip } from './formatPlaceOwnerChip.js';

export function renderPlaceTile(container, viewModel, onTap, openDetails = onTap) {
	if (!container) return;
	const place = viewModel?.activePlace;
	if (!place) {
		container.innerHTML = '<div class="board-place__empty" data-place-empty>No Place in play</div>';
		return;
	}

	const ownerId = viewModel.activePlacePlayedBy || null;
	const cardId = place.cardId || place.id;
	const tile = renderCard(place, { compact: true, fieldMode: true });
	tile.classList.add('card--previewable', 'board-place__card');
	tile.dataset.zone = 'place';
	if (cardId) tile.dataset.cardId = cardId;
	if (ownerId) {
		tile.dataset.playerId = ownerId;
		tile.dataset.placeOwner = ownerId;
		const chip = document.createElement('span');
		chip.className = 'place-owner-chip';
		chip.dataset.placeOwnerChip = '';
		chip.textContent = formatPlaceOwnerChip({ isMine: ownerId === viewModel.myPlayerId, turns: viewModel.activePlaceTurns });
		tile.appendChild(chip);
	}
	const merged = { ...(getCardById(cardId) || place), ...place };
	tile.addEventListener('click', () => onTap?.(merged));
	tile._boardOpenDetails = () => openDetails?.(merged); // the controller's Details chip reaches the current render's view

	container.replaceChildren(tile);
}
