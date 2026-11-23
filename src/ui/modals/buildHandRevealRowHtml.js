// buildHandRevealRowHtml.js — one row of the hand viewer (a card shows you the opponent's hand): the card's name, then its
// type in plain words ("Varkenspootjes · Piecie"). An unknown id shows the id alone. Every value is escaped.
import { escapeHtml } from '../cardV1/escapeHtml.js';
import { getCardTypeLabel } from '../phone/getCardTypeLabel.js';

export function buildHandRevealRowHtml(cardId, cardLookup) {
	const def = cardLookup?.[cardId];
	const name = `<span class="hand-reveal-name">${escapeHtml(def?.name || cardId)}</span>`;
	const type = def?.type ? `<span class="hand-reveal-type"> · ${escapeHtml(getCardTypeLabel(def))}</span>` : '';
	return `<li>${name}${type}</li>`;
}
