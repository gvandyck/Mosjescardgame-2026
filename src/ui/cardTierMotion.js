// cardTierMotion.js — Phase 50: decides which tier cards may animate and
// which are "small". One shared IntersectionObserver + one MutationObserver.
// - Tier 3/4 full cards inside zoom / spotlight / detail preview / field area
//   get .card--tier-anim while on screen; off-screen they pause.
// - Hand-strip cards never animate.
// - Any tier card narrower than 120px gets .card--tier-small (no side text/glints).

const ANIM_CONTAINERS = '.hover-zoom, .card-spotlight, .cd-preview, .modal-mosje-preview, #board-root';
const HAND = '.hand-card-wrap, .hand-cards, .hand-strip, #hand-root';
const TIER_CARD = '.card-v1--full.card--tierlayout';
const SMALL_PX = 120;

let started = false;

export function initCardTierMotion(root = document.body) {
	if (started || typeof IntersectionObserver === 'undefined' || !root) return;
	started = true;
	const watched = new Set();

	const io = new IntersectionObserver((entries) => {
		for (const e of entries) {
			const el = e.target;
			el.classList.toggle('card--tier-small', e.boundingClientRect.width > 0 && e.boundingClientRect.width < SMALL_PX);
			const canAnim = /^[34]$/.test(el.dataset.tier || '') && !el.closest(HAND) && !!el.closest(ANIM_CONTAINERS);
			el.classList.toggle('card--tier-anim', canAnim && e.isIntersecting);
		}
	});

	const scan = () => {
		for (const el of watched) {
			if (!el.isConnected) { io.unobserve(el); watched.delete(el); }
		}
		for (const el of root.querySelectorAll(TIER_CARD)) {
			if (!watched.has(el)) { watched.add(el); io.observe(el); }
		}
	};

	let queued = false;
	new MutationObserver(() => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(() => { queued = false; scan(); });
	}).observe(root, { childList: true, subtree: true });
	scan();
}
