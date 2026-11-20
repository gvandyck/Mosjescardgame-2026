// buildOptionRowHtml.js — one row of the generic option modal as HTML. Plain rows keep the markup the modal always drew;
// an option with a card (cardId / card) becomes a card row whose face is mounted later by mountOptionCards.
// Every value is escaped except metaLabel, which callers pass already escaped (escapeMeta) or as a coloured span.
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function buildOptionRowHtml(opt, index) {
	const id = opt?.id ?? '';
	const label = opt?.label ?? String(id);
	const meta = opt?.metaLabel ?? '';
	const isDisabled = Boolean(opt?.disabled);
	const disabledAttr = isDisabled ? 'disabled' : '';
	const disabledClass = isDisabled ? 'modal-mosje-select-btn--disabled' : '';
	const hasCard = Boolean(opt?.cardId || opt?.card);
	if (hasCard) {
		return `<button class="modal-mosje-select-btn modal-option--card ${disabledClass}" data-id="${escapeHtml(String(id))}" type="button" ${disabledAttr}>
					<span class="option-card-slot" data-option-card="${index}"></span>
					<span class="mosje-select-name">${escapeHtml(String(label))}</span>
					${meta ? `<span class="mosje-select-mp">${meta}</span>` : ''}
				</button>`;
	}
	return `<button class="modal-mosje-select-btn ${disabledClass}" data-id="${escapeHtml(String(id))}" type="button" ${disabledAttr}>
					<span class="mosje-select-name">${escapeHtml(String(label))}</span>
					${meta ? `<span class="mosje-select-mp">${meta}</span>` : ''}
				</button>`;
}
