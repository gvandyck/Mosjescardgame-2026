// buildPreviewActionsHtml - the "why not" line and the action buttons at the bottom of a card detail view (72-04, D-02, D-03).
// actions: [{ id, label, disabled?, title? }]. Everything is escaped (T-72-05). No actions and no reason returns ''.
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function buildPreviewActionsHtml(actions, reason = '') {
	const why = reason ? `<p class="cd-why">${escapeHtml(reason)}</p>` : '';
	const list = Array.isArray(actions) ? actions.filter(Boolean) : [];
	if (!list.length) return why;
	const buttons = list.map(a => `<button class="modal-btn cd-action" type="button" data-action-id="${escapeHtml(a.id)}"${a.disabled ? ' disabled aria-disabled="true"' : ''}${a.title ? ` title="${escapeHtml(a.title)}"` : ''}>${escapeHtml(a.label)}</button>`).join('');
	return `${why}<div class="cd-actions">${buttons}</div>`;
}
