// modalManager.js — Shows and hides popup overlays:
// dice roll animations, card zoom view, yes/no confirmations.
// Filled in Phase 5.

console.log('[UI] modalManager.js loaded');

export function initModalManager(container) {
	if (!container) {
		return {
			showInfo: () => {},
			showConfirm: async () => false,
			close: () => {},
		};
	}

	container.innerHTML = '';

	function close() {
		container.innerHTML = '';
		container.classList.remove('modal-root--open');
	}

	function showInfo(title, message) {
		container.classList.add('modal-root--open');
		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card" role="dialog" aria-modal="true">
				<h3>${escapeHtml(title)}</h3>
				<p>${escapeHtml(message)}</p>
				<button class="modal-btn" id="modal-ok">OK</button>
			</section>
		`;

		container.querySelector('#modal-ok')?.addEventListener('click', close);
	}

	async function showConfirm(title, message) {
		return new Promise(resolve => {
			container.classList.add('modal-root--open');
			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(title)}</h3>
					<p>${escapeHtml(message)}</p>
					<div class="modal-actions">
						<button class="modal-btn" id="modal-yes">Yes</button>
						<button class="modal-btn modal-btn--ghost" id="modal-no">No</button>
					</div>
				</section>
			`;

			container.querySelector('#modal-yes')?.addEventListener('click', () => {
				close();
				resolve(true);
			});

			container.querySelector('#modal-no')?.addEventListener('click', () => {
				close();
				resolve(false);
			});
		});
	}

	return { showInfo, showConfirm, close };
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
