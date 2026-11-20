// renderStatusStrip.js — draws the ONE status message into #status-strip (63-UI-SPEC "Status strip", D-04, D-17, D-19).
// msg = { kind, text, lines?: [{ kind, text }] } from pickStatusMessage, or null (empty strip: transparent, its 44 px stay reserved).
// Sets data-status-kind and the escaped text; a 'preview' message adds a Confirm button (data-confirm); 'choose-target',
// 'preview' and 'choose-quest' add a Cancel button (data-cancel). Buttons are >= 44 px (board-2-0.css).
// The strip is rebuilt only when its content changes, so a click is never lost to a re-render between press and release;
// the latest onConfirm / onCancel are kept on the element and called by the (long-lived) buttons.
import { escapeHtml } from '../cardV1/escapeHtml.js';

const CANCELLABLE = new Set(['choose-target', 'preview', 'choose-quest']);

function buildButtons(kind) {
	const confirm = kind === 'preview' ? '<button type="button" class="status-strip__btn status-strip__btn--confirm" data-confirm>Confirm</button>' : '';
	const cancel = CANCELLABLE.has(kind) ? '<button type="button" class="status-strip__btn status-strip__btn--cancel" data-cancel>Cancel</button>' : '';
	return `${confirm}${cancel}`;
}

export function renderStatusStrip(el, msg, { onConfirm, onCancel } = {}) {
	if (!el) return;
	el._statusHandlers = { onConfirm, onCancel };
	const lines = Array.isArray(msg?.lines) ? msg.lines : [];
	const signature = msg ? `${msg.kind}\u0000${msg.text}\u0000${lines.map(l => `${l.kind}:${l.text}`).join('|')}` : '';
	if (el._statusSignature === signature) return;
	el._statusSignature = signature;

	if (!msg) {
		el.removeAttribute('data-status-kind');
		el.innerHTML = '';
		return;
	}
	el.setAttribute('data-status-kind', String(msg.kind));
	const blocked = msg.blocked ? ' status-strip__text--blocked' : '';
	const lineHtml = lines.length ? `<div class="status-strip__lines">${lines.map(l => `<div class="strip-line strip-line--${escapeHtml(l.kind)}">${escapeHtml(l.text)}</div>`).join('')}</div>` : '';
	el.innerHTML = `<span class="status-strip__text${blocked}">${escapeHtml(msg.text)}</span>${lineHtml}${buildButtons(msg.kind)}`;
	el.querySelector('[data-confirm]')?.addEventListener('click', () => el._statusHandlers?.onConfirm?.());
	el.querySelector('[data-cancel]')?.addEventListener('click', () => el._statusHandlers?.onCancel?.());
}
