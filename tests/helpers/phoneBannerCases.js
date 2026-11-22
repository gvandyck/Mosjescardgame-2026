// phoneBannerCases.js - Phase 72.1-09: stage and measure the transient banners of a phone game (cast chip, Place banner, turn and
// deck-out banners, toast, spotlight). The banners are raised through the page's own modules (same instances the game uses), then
// read with their animation frozen so the box is the layout box, not a frame of the pop-in.
import { setMosjeOnField, clearEntryProtection } from '../ui/helpers.js';

/** Freeze every CSS animation so a banner's box is its layout box (the animation is never asserted). */
export async function freezeAnimations(page) {
	await page.addStyleTag({ content: '.turn-transition,.deckout-banner,.cast-chip,.place-effect-banner,.card-spotlight{animation:none !important;opacity:1 !important}' });
}

/** Two Mosjes each side (slots 0 and 1) so the left-most and right-most tile of both rows exist. */
export async function seedBannerBoard(page) {
	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await page.waitForTimeout(500);
}

/** Fire the real cast chip on a Mosje tile, wait for the pop-in, return its box and facts; null when no chip appeared. */
export async function castChipOn(page, playerId, slotIndex) {
	await page.evaluate(async ({ playerId, slotIndex }) => {
		const m = await import('/src/ui/actionAnimations.js');
		m.setAbilityNameResolver(() => 'Quite A Long Ability Name');
		m.animateFieldActivation({ zone: 'mosje', playerId, slotIndex, cardId: 'mosje_gandoe_wizard' });
	}, { playerId, slotIndex });
	await page.waitForSelector('.cast-chip', { timeout: 4000 }).catch(() => null);
	await page.waitForTimeout(1000); // the 0.7 s pop-in is over, the chip holds
	return page.evaluate(() => {
		const chip = document.querySelector('.cast-chip');
		if (!chip) return null;
		const r = chip.getBoundingClientRect();
		const cs = getComputedStyle(chip);
		const bar = [...document.querySelectorAll('#phone-bar button, #phone-bar [role=button]')]
			.map((b) => b.getBoundingClientRect()).filter((b) => b.width > 0 && b.height > 0)
			.filter((b) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top).length;
		return {
			left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, vw: innerWidth, vh: innerHeight,
			font: parseFloat(cs.fontSize), pe: cs.pointerEvents, barHits: bar, text: chip.textContent,
		};
	});
}

/** Box and pointer-events of the first element matching sel, or null. */
export async function boxOf(page, sel) {
	return page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		const r = el.getBoundingClientRect();
		const cs = getComputedStyle(el);
		const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
		return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight, pe: cs.pointerEvents, lines: Math.round(r.height / lh) };
	}, sel);
}
