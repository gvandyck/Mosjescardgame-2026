// readTable.js - Phase 65-05: the whole phone table as plain numbers, for the whole-table-fit spec. Boxes are rounded to 0.1 px
// { x, y, w, h, right, bottom } (null when the element is absent). Reads the live page only.
// - header / strip / bar: the top bar, the status strip and the bottom bar; board: #board-root with its client box (inside the
//   border) and scrollH / scrollW plus the horizontal padding, contentBottom (where the last child ends) and free (px left under it,
//   negative = the table runs past the board); opp / me: the two .board-zone boxes
// - quests: per .quest-stack { box, count (the "N left" tab), empty }
// - place: the #board-place box and its .card box (null while no Place is active)
// - endTurnDisplay: computed display of .board-end-turn; endTurnInBar: #btn-end-turn sits inside #phone-bar
// - scales: the inline --opp-scale / --me-scale on the board ('' when not set)

/** @param {import('@playwright/test').Page} page */
export async function readTable(page) {
	return page.evaluate(() => {
		const n = (v) => Math.round(v * 10) / 10;
		const box = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height), right: n(r.right), bottom: n(r.bottom) };
		};
		const board = document.getElementById('board-root');
		const b = board.getBoundingClientRect();
		const cs = getComputedStyle(board);
		// Where the table really ends (scrollHeight is clamped to clientHeight when the table is shorter): the last child's bottom.
		const last = board.lastElementChild;
		const contentBottom = last ? n(last.getBoundingClientRect().bottom + (parseFloat(getComputedStyle(last).marginBottom) || 0) + parseFloat(cs.paddingBottom)) : 0;
		const clientBox = {
			x: n(b.left + board.clientLeft), y: n(b.top + board.clientTop), w: board.clientWidth, h: board.clientHeight,
			right: n(b.left + board.clientLeft + board.clientWidth), bottom: n(b.top + board.clientTop + board.clientHeight),
		};
		return {
			vw: window.innerWidth,
			vh: window.innerHeight,
			header: box(document.querySelector('header.game-topbar')),
			strip: box(document.getElementById('status-strip')),
			bar: box(document.getElementById('phone-bar')),
			board: {
				...clientBox, scrollH: board.scrollHeight, scrollW: board.scrollWidth, contentBottom, free: n(clientBox.bottom - contentBottom),
				padL: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight),
			},
			opp: box(board.querySelector('.board-zone--opponent')),
			me: box(board.querySelector('.board-zone--player')),
			quests: [...board.querySelectorAll('.quest-stack')].map((el) => ({
				box: box(el), count: box(el.querySelector('.quest-stack__count')),
				empty: el.classList.contains('quest-stack--empty'),
			})),
			place: { box: box(document.getElementById('board-place')), card: box(document.querySelector('#board-place .card')) },
			endTurnDisplay: getComputedStyle(board.querySelector('.board-end-turn')).display,
			endTurnInBar: !!document.querySelector('#phone-bar #btn-end-turn'),
			scales: { opp: board.style.getPropertyValue('--opp-scale'), me: board.style.getPropertyValue('--me-scale') },
		};
	});
}
