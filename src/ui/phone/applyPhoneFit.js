// applyPhoneFit.js — makes the whole phone table fit between the header and the bottom bar (Phase 65-05, D-04, D-05). It measures the
// board's content height at three scale settings, lets computePhoneScales pick the opponent scale first and my scale second, and
// writes --opp-scale / --me-scale on the board (phone-board.css and phone-middle.css size every tile from them). Called after every
// board render and on every resize (bindPhoneFit). Synchronous: no timer, no animation. Outside the phone layout it removes both
// variables, so the desktop table is untouched. My tile never drops below MIN_TILE px (D-15, the faces stay readable); when even
// that is not enough the board scrolls vertically inside itself.
import { isPhoneLayout } from './isPhoneLayout.js';
import { computePhoneScales } from './computePhoneScales.js';

const MIN_OPP = 0.7;
const MIN_TILE = 100;

function write(board, opp, me) {
	board.style.setProperty('--opp-scale', String(opp));
	board.style.setProperty('--me-scale', String(me));
}

// The content height WITHOUT the clamp to clientHeight that scrollHeight has: when the table is shorter than the board, the bottom
// of its last child (plus margin and padding) still tells how much room is left. When it overflows, scrollHeight is exact.
function contentHeight(board) {
	if (board.scrollHeight > board.clientHeight) return board.scrollHeight;
	const last = board.lastElementChild;
	if (!last) return board.scrollHeight;
	const style = getComputedStyle(board);
	const top = board.getBoundingClientRect().top + board.clientTop - board.scrollTop;
	return last.getBoundingClientRect().bottom - top + (parseFloat(getComputedStyle(last).marginBottom) || 0) + (parseFloat(style.paddingBottom) || 0);
}

// The smallest my-scale that keeps my tile at MIN_TILE px, rounded UP to 3 decimals so the rounding never goes under. It reads the
// tile's LAYOUT width (computed style), not its bounding box: a card in its entry animation or under a hover is transformed, and
// offsetWidth rounds to whole pixels.
function smallestMeScale(board) {
	const tile = board.querySelector('.board-zone--player .board-zone__slots > *');
	const width = tile ? parseFloat(getComputedStyle(tile).width) : 0;
	return width > 0 ? Math.min(1, Math.ceil((MIN_TILE / width) * 1000) / 1000) : 0.9;
}

export function applyPhoneFit(board) {
	if (!board) return;
	if (!isPhoneLayout()) {
		board.style.removeProperty('--opp-scale');
		board.style.removeProperty('--me-scale');
		return;
	}

	write(board, 1, 1);
	const available = board.clientHeight;
	const full = contentHeight(board);
	if (available <= 0 || full <= available) return;

	const minMe = smallestMeScale(board);
	write(board, MIN_OPP, 1);
	const oppMin = contentHeight(board);
	write(board, MIN_OPP, minMe);
	const bothMin = contentHeight(board);

	const { opp, me } = computePhoneScales({ available, full, oppMin, bothMin, minOpp: MIN_OPP, minMe });
	write(board, opp, me);
}
