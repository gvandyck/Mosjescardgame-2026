// readGameOverCard.js - Playwright helper (not a test file): what the game-over card does against the window right now.
// Reads only; scrollTo is 'top' | 'bottom' | null and moves the card's own scroll first.

/** @param {import('@playwright/test').Page} page @param {'top'|'bottom'|null} [scrollTo] */
export async function readGameOverCard(page, scrollTo = null) {
	return page.evaluate((to) => {
		const card = document.querySelector('.reward-card');
		if (to === 'top') card.scrollTop = 0;
		if (to === 'bottom') card.scrollTop = card.scrollHeight;
		const box = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: r.left, y: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
		};
		const c = box(card);
		const actions = card.querySelector('.reward-actions');
		const btns = [...card.querySelectorAll('.reward-btn')].map(box);
		const stats = [...card.querySelectorAll('.go-player')].map(box);
		const dice = [...card.querySelectorAll('.dice-row > *')].map(box);
		const doc = document.documentElement;
		return {
			win: { w: window.innerWidth, h: window.innerHeight },
			card: c,
			scrollW: card.scrollWidth, clientW: card.clientWidth,
			scrollH: card.scrollHeight, clientH: card.clientHeight,
			overflowY: getComputedStyle(card).overflowY,
			pageX: doc.scrollWidth - window.innerWidth,
			pageY: doc.scrollHeight - window.innerHeight,
			actions: box(actions),
			btns, stats, dice,
			quest: box(card.querySelector('.go-winning-quest')),
			questCard: box(card.querySelector('.go-winning-quest__card')),
			questFace: box(card.querySelector('.go-winning-quest__card .card')),
			mosjeName: !!card.querySelector('.go-winning-quest__mosje-name'),
			title: card.querySelector('.reward-title')?.textContent || '',
			reason: card.querySelector('.reward-reason')?.textContent || '',
		};
	}, scrollTo);
}
