// buildLeaveOptionHtml.js — the always-visible "no / leave it" button of the generic option modal.
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function buildLeaveOptionHtml(leave) {
	if (!leave) return '';
	const id = leave.id ?? 'leave';
	const label = leave.label ?? 'Leave it';
	return `<button class="modal-btn modal-btn--ghost modal-option-leave" data-id="${escapeHtml(String(id))}" type="button">${escapeHtml(String(label))}</button>`;
}
