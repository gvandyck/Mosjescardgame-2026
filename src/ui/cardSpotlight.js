import { renderCard } from './cardRenderer.js';
import { getCardById } from '../data/cardIndex.js';

const ENTER_MS = 380;
const HOLD_MS = 1500;
const EXIT_MS = 420;
const EFFECT_WINDOW_MS = 1600;

let current = null;

function escapeText(s) {
	return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resolveSource(src) {
	if (!src) return null;
	if (src.el?.isConnected) return src.el;
	if (!src.zone) return null;
	const parts = [`[data-zone="${src.zone}"]`];
	if (src.playerId) parts.push(`[data-player-id="${src.playerId}"]`);
	if (src.slotIndex != null) parts.push(`[data-slot-index="${src.slotIndex}"]`);
	return document.querySelector(parts.join(''));
}

// Transform that maps the spotlight box onto the source card's rect (FLIP).
function transformTo(spotEl, sourceEl) {
	if (!sourceEl) return 'scale(0.4)';
	const s = sourceEl.getBoundingClientRect();
	const t = spotEl.getBoundingClientRect();
	const dx = (s.left + s.width / 2) - (t.left + t.width / 2);
	const dy = (s.top + s.height / 2) - (t.top + t.height / 2);
	return `translate(${dx}px, ${dy}px) scale(${s.width / t.width})`;
}

function dismiss(spot, immediate = false) {
	if (!spot || spot.closing) return;
	spot.closing = true;
	clearTimeout(spot.timer);
	if (current === spot) current = null;
	const done = () => spot.el.remove();
	if (immediate) return done();
	const target = transformTo(spot.el, resolveSource(spot.source));
	spot.el.animate(
		[{ transform: 'none', opacity: 1 }, { transform: target, opacity: 0.2 }],
		{ duration: EXIT_MS, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)', fill: 'forwards' },
	).onfinish = done;
}

/**
 * Show a card large on the right of the screen, then fly it back to its board slot.
 * source: { el } or { zone, playerId, slotIndex } (re-resolved on exit — the board re-renders).
 */
export function showCardSpotlight({ cardId, source, effects = [] } = {}) {
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
	const def = getCardById(cardId);
	if (!def) return null;
	if (current) dismiss(current, true);

	const card = renderCard({ ...def, description: def.abilityDescription || def.description || '' }, { compact: false });
	const el = document.createElement('div');
	el.className = 'card-spotlight';
	el.appendChild(card);
	const fx = document.createElement('div');
	fx.className = 'spot-effects';
	el.appendChild(fx);
	document.body.appendChild(el);

	const spot = { el, fx, source, createdAt: performance.now(), closing: false, timer: null };
	current = spot;
	el.animate(
		[{ transform: transformTo(el, resolveSource(source)), opacity: 0.2 }, { transform: 'none', opacity: 1 }],
		{ duration: ENTER_MS, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)', fill: 'backwards' },
	);
	spot.timer = setTimeout(() => dismiss(spot), ENTER_MS + HOLD_MS);
	if (effects.length) addSpotlightEffects(effects);
	return spot;
}

/** effects: [{ text, kind: 'loss'|'gain'|'info', sub? }] — shown on the live spotlight card. */
export function addSpotlightEffects(effects) {
	const spot = current;
	if (!spot || spot.closing || performance.now() - spot.createdAt > EFFECT_WINDOW_MS) return false;
	for (const fx of effects) {
		const row = document.createElement('div');
		row.className = `spot-effect spot-effect--${fx.kind || 'info'}`;
		row.innerHTML = `${escapeText(fx.text)}${fx.sub ? `<small>${escapeText(fx.sub)}</small>` : ''}`;
		spot.fx.appendChild(row);
	}
	// Effect rows replace the card's text block (it overlaps them); see arena.css.
	spot.el.classList.add('spot-has-effects');
	// Flash the card in the effect's colour (damage red / heal green / shield blue).
	const kind = effects[effects.length - 1].kind || 'info';
	const cardEl = spot.el.querySelector('.card');
	cardEl?.classList.remove('spot-flash--loss', 'spot-flash--gain', 'spot-flash--shield');
	void cardEl?.offsetWidth;
	cardEl?.classList.add(`spot-flash--${kind}`);
	clearTimeout(spot.timer);
	spot.timer = setTimeout(() => dismiss(spot), ENTER_MS + HOLD_MS);
	return true;
}

/** True while a spotlight is on screen (the bot loop waits so its plays can be read). */
export function isSpotlightActive() {
	return !!current && !current.closing;
}
