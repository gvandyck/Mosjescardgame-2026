// buildAttachmentSection.js — the "Attachments n / max" section of the Mosje detail view as HTML (72-05, D-06).
// attachments = getAttachmentRows output. All text is escaped.
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function buildAttachmentSection({ rows = [], count = 0, max = 2 } = {}) {
	const items = rows.map(r =>
		`<div class="cd-attach" data-card-id="${escapeHtml(r.cardId)}"><b>${escapeHtml(r.name)}</b><span>${escapeHtml(r.text)}</span></div>`).join('');
	return `<div class="cd-attach-count">Attachments ${Number(count)} / ${Number(max)}</div>${items}`;
}
