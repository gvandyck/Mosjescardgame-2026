// buildRaiseDock.js — fills the raise dock in the phone bar for a freshly raised card (Phase 65-06, D-10): a tile thumbnail, the name,
// one info line, and the three buttons [data-raise-details], [data-raise-play], [data-raise-cancel] (each at least 44 px, styles/
// phone-raise.css). Built with createElement + textContent only; card text never reaches innerHTML (T-65-08). The click handling is one
// delegated listener on the dock (initPhoneHand), so rebuilding the nodes never loses it. The thumbnail is decoration (aria-hidden).
import { renderCard } from '../cardRenderer.js';
import { getCardById } from '../../data/cardIndex.js';
import { describeRaiseView } from './describeRaiseView.js';

function node(doc, tag, className, text) {
	const el = doc.createElement(tag);
	el.className = className;
	if (text !== undefined) el.textContent = text;
	return el;
}

function button(doc, className, attr, text, label) {
	const el = node(doc, 'button', `raise__btn ${className}`, text);
	el.type = 'button';
	el.setAttribute(attr, '');
	if (label) el.setAttribute('aria-label', label);
	return el;
}

export function buildRaiseDock(dock, view, doc = document) {
	const { name, line, disabled } = describeRaiseView(view);
	const thumb = node(doc, 'div', 'raise__thumb');
	thumb.setAttribute('aria-hidden', 'true');
	const face = renderCard({ ...(getCardById(view.cardId) || view.card), ...view.card }, { compact: true, fieldMode: true });
	face.removeAttribute('data-card-id'); // the hand card keeps that id; one id per card on the page
	thumb.appendChild(face);

	const info = node(doc, 'div', 'raise__info');
	info.append(node(doc, 'span', 'raise__name', name), node(doc, 'span', 'raise__line', line));

	const play = button(doc, 'raise__btn--play', 'data-raise-play', 'Play');
	play.setAttribute('aria-disabled', String(disabled));
	dock.replaceChildren(thumb, info, button(doc, 'raise__btn--details', 'data-raise-details', 'Details'), play,
		button(doc, 'raise__btn--cancel', 'data-raise-cancel', '', 'Cancel'));
	dock.dataset.cardId = view.cardId;
}
