// phoneGate.js - Phase 72.1-02 (D-09): the shared "is this phone screen sound" gate every phone spec can call.
// Fails on: page-level sideways scroll, a visible control smaller than 44 px, an element wider than the screen, an element
// sticking out past the left/right screen edge, and (unless the screen is meant to scroll) an element taller than the screen,
// each only when no ancestor is a scroll or clip container that explains it. Reads the live page, changes nothing.
import { expect } from '@playwright/test';
import { pageOverflow } from './phoneGeometry.js';

const CONTROLS = 'button, [role=button], [role=radio], a[href], input, select, textarea';

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ name: string, allowSmall?: string[], scrollsVertically?: boolean, min?: number }} opts
 *   allowSmall: CSS selectors of controls allowed under min px (name each one in the spec); scrollsVertically: the page itself
 *   scrolls down on this screen (the lobby), so a tall element is fine.
 */
export async function expectPhoneScreenSound(page, { name, allowSmall = [], scrollsVertically = false, min = 44 }) {
	const over = await pageOverflow(page);
	expect(over.x, `${name}: no sideways page scroll (scrollWidth - innerWidth)`).toBeLessThanOrEqual(0);

	const problems = await page.evaluate(({ controls, allowSmall, scrollsVertically, min }) => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const label = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
		const shown = (el) => {
			const cs = getComputedStyle(el);
			if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
			const r = el.getBoundingClientRect();
			return r.width > 0 && r.height > 0;
		};
		const inContainer = (el, axis) => {
			for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
				const cs = getComputedStyle(p);
				const o = axis === 'x' ? cs.overflowX : cs.overflowY;
				if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true;
			}
			return false;
		};
		const hiddenByAncestor = (el) => {
			for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
				const cs = getComputedStyle(p);
				if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0 || p.hidden) return true;
			}
			return false;
		};
		const out = { small: [], wide: [], tall: [], edge: [] };
		for (const el of document.querySelectorAll(controls)) {
			if (!shown(el) || hiddenByAncestor(el) || el.matches('input[type=hidden]')) continue;
			if (allowSmall.some((s) => el.matches(s))) continue;
			const r = el.getBoundingClientRect();
			if (r.width < min || r.height < min) out.small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
		}
		for (const el of document.querySelectorAll('body *')) {
			if (!shown(el) || hiddenByAncestor(el)) continue;
			const cs = getComputedStyle(el);
			if (cs.position === 'fixed' && cs.pointerEvents === 'none') continue;
			const r = el.getBoundingClientRect();
			if (r.width > vw + 1 && !inContainer(el, 'x')) out.wide.push(`${label(el)} w${Math.round(r.width)}`);
			if (!scrollsVertically && r.height > vh + 1 && !inContainer(el, 'y')) out.tall.push(`${label(el)} h${Math.round(r.height)}`);
			if ((r.right > vw + 1 || r.left < -1) && r.width <= vw + 1 && !inContainer(el, 'x')) out.edge.push(`${label(el)} ${Math.round(r.left)}..${Math.round(r.right)}`);
		}
		return out;
	}, { controls: CONTROLS, allowSmall, scrollsVertically, min });

	expect(problems.small, `${name}: every control is at least ${min}x${min} px`).toEqual([]);
	expect(problems.wide, `${name}: nothing wider than the screen outside a scroll container`).toEqual([]);
	expect(problems.tall, `${name}: nothing taller than the screen outside a scroll container`).toEqual([]);
	expect(problems.edge, `${name}: nothing clipped by the left or right screen edge`).toEqual([]);
}
