/**
 * slot-tiles.spec.js - Phase 64.1, D-01 / D-02 / D-06 / D-08 / D-09 / D-12: the fixed slots read clearly, and "Place here"
 * marks the ONE slot a raised or dragged hand card will go into.
 * The engine (playMosje / playPiecie) fills the FIRST free slot and takes no slot index, so exactly one slot is marked and the
 * slots stay inert. There is no "selected hand card" (a tap plays at once): the hint shows while a playable, payable card is
 * raised (pointer hover) and during an HTML5 drag, which is the non-hover path. D-12 (Gandalf, 2026-10-27): the raised hand card
 * covers part of the player row, so the marked slot's "Place here" must be drawn OVER it; the hit-test below FAILS when the
 * hand card is the topmost element at the label's centre.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection, setHand, setEnergy,
	getGameState, playCardFromHand,
} from './helpers.js';
import { readPaintOverflow } from '../helpers/paintOverflow.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';
const FISSA = 'mosje_alyssa_fissa';
const DONER = 'piecie_broodje_doner';
const FILLER = 'piecie_kannetje_melk';

const hint = (page) => page.locator('#board-root [data-place-here]');
const wrapOf = (page, cardId) => page.locator(`.hand-card-wrap[data-card-id="${cardId}"]`).first();
const raise = (page, cardId) => wrapOf(page, cardId).hover({ position: { x: 100, y: 30 } });
async function away(page) {
	await page.mouse.move(2, 2);
	await page.waitForTimeout(300);
}

/**
 * Board with a free first Mosje slot (0) and a free second Piecie slot (1), 6 Energy. The hand is five cards: the fan puts
 * the Mosje card at the far left (its raised card covers Mosje slot 0) and the Piecie card in the middle (its raised card covers
 * Piecie slot 1), so the D-12 hit-test is not vacuous. The fillers are Piecies that nothing in this spec plays.
 */
async function seed(page, viewport) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.setViewportSize(viewport);
	const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	if (await draw.first().isVisible().catch(() => false)) await draw.first().click();
	await setMosjeOnField(page, 'player_1', 0, null);
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_bulldozer', { mp: 50 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 50 });
	await setMosjeOnField(page, 'player_2', 1, null);
	await page.evaluate(() => {
		window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_affoe', { faceDown: true });
		window.__testHooks.setPiecieOnField('player_1', 1, null);
		window.__testHooks.setPiecieOnField('player_1', 2, null);
	});
	await clearEntryProtection(page);
	await setHand(page, 'player_1', [FISSA, FILLER, DONER, FILLER, FILLER]);
	await setEnergy(page, 'player_1', 6);
	await page.mouse.move(2, 2);
	await page.waitForTimeout(700); // the hand re-fans and its transition settles
}

/** Read the alpha of an `rgb(...)` / `rgba(...)` computed colour (1 when there is no alpha part). */
function alphaOf(css) {
	const parts = css.match(/[\d.]+/g) || [];
	return parts.length >= 4 ? Number(parts[3]) : 1;
}

/**
 * D-12 hit-test: at the centre of the "Place here" label the topmost element must be the label (or inside the marker), and
 * never the raised hand card. The marker is pointer-events: none on purpose (the slots are inert), and elementFromPoint skips
 * such elements, so the label gets pointer-events: auto for the length of the test only: the answer is then decided by the
 * stacking order alone. `covered` says the raised hand card's box really overlaps the label's box, so a pass is not vacuous.
 */
async function hitTestLabel(page) {
	return page.evaluate(() => {
		const label = document.querySelector('[data-place-here-label]');
		if (!label) return { ok: false, why: 'no label in the document' };
		const r = label.getBoundingClientRect();
		const x = r.left + r.width / 2;
		const y = r.top + r.height / 2;
		if (!(r.width > 0 && r.height > 0)) return { ok: false, why: 'label has no size' };
		if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return { ok: false, why: 'label centre is outside the viewport', x, y };
		const previous = label.style.pointerEvents;
		label.style.pointerEvents = 'auto';
		const top = document.elementFromPoint(x, y);
		label.style.pointerEvents = previous;
		const describe = (el) => (el ? `${el.tagName.toLowerCase()}.${el.className || ''}` : 'none');
		const inLabel = !!top && (top === label || label.contains(top));
		const inMarker = !!top && !!top.closest('[data-place-here], [data-place-here-overlay]');
		const inHand = !!top && !!top.closest('.hand-card-wrap');
		const hand = document.querySelector('.hand-card-wrap:hover');
		const hr = hand ? hand.getBoundingClientRect() : null;
		const covered = !!hr && r.left < hr.right && r.right > hr.left && r.top < hr.bottom && r.bottom > hr.top;
		return {
			ok: (inLabel || inMarker) && !inHand,
			covered,
			why: `topmost at (${Math.round(x)}, ${Math.round(y)}) = ${describe(top)}`,
			label: { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
			raisedHandCard: hr ? { left: Math.round(hr.left), top: Math.round(hr.top), right: Math.round(hr.right), bottom: Math.round(hr.bottom) } : null,
		};
	});
}

async function expectLabelOnTop(page, what) {
	const result = await hitTestLabel(page);
	console.log(`[64.1 D-12] ${what}:`, JSON.stringify(result));
	expect(result.covered, `${what}: the raised hand card must overlap the label, otherwise this check proves nothing: ${JSON.stringify(result)}`).toBe(true);
	expect(result.ok, `${what}: "Place here" must be the topmost element at its centre, not the raised hand card: ${JSON.stringify(result)}`).toBe(true);
	return result;
}

test('D-01/D-02: 2 Mosje + 3 Piecie slots per side, empty slots clearly visible without hover', async ({ page }) => {
	test.setTimeout(90000);
	await seed(page, { width: 1920, height: 1080 });

	for (const side of ['player', 'opponent']) {
		expect(await page.locator(`#zone-${side} > [data-slot-kind="mosje"]`).count(), `${side} Mosje slots`).toBe(2);
		expect(await page.locator(`#piecies-${side} > [data-slot-kind="piecie"]`).count(), `${side} Piecie slots`).toBe(3);
	}
	const empty = page.locator('#board-root .board-slot--empty');
	expect(await empty.count(), 'empty slots on the seeded board').toBeGreaterThanOrEqual(3);

	const looks = await empty.evaluateAll((els) => els.map((el) => {
		const cs = getComputedStyle(el);
		return { width: cs.borderTopWidth, style: cs.borderTopStyle, border: cs.borderTopColor, fill: cs.backgroundColor, kind: el.dataset.slotKind, index: el.dataset.slotIndex };
	}));
	for (const look of looks) {
		const what = `empty ${look.kind} slot ${look.index}`;
		expect(look.width, `${what} border width`).toBe('2px');
		expect(look.style, `${what} border style`).toBe('dashed');
		expect(alphaOf(look.border), `${what} border alpha`).toBeGreaterThanOrEqual(0.35);
		expect(alphaOf(look.fill), `${what} fill alpha`).toBeGreaterThan(0);
		expect(alphaOf(look.fill), `${what} fill alpha`).toBeLessThanOrEqual(0.1);
	}

	expect(await hint(page).count(), 'no hint with the mouse away').toBe(0);
	expect(await page.locator('#board-root').innerText(), 'no "Place here" text without a raised card').not.toContain('Place here');
	expect(await readPaintOverflow(page, '#board-root .board-slot--empty'), 'empty slots paint inside every clip').toEqual([]);

	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/slot-empty-1920x1080.png` });
});

test('D-02/D-06/D-09/D-12: the raised or dragged card marks exactly the slot it will go into', async ({ page }) => {
	test.setTimeout(90000);
	await seed(page, { width: 1920, height: 1080 });

	// a. A raised Mosje marks the first free own Mosje slot (0) and nothing else.
	await raise(page, FISSA);
	await expect.poll(() => hint(page).count(), 'hint while the Mosje card is raised').toBe(1);
	const mosjeHint = hint(page);
	expect(await mosjeHint.evaluate((el) => !!el.closest('#zone-player')), 'inside my Mosje row').toBe(true);
	expect(await mosjeHint.getAttribute('data-slot-kind')).toBe('mosje');
	expect(await mosjeHint.getAttribute('data-slot-index')).toBe('0');
	expect(await page.locator('[data-place-here-label]').count(), 'exactly one label').toBe(1);
	expect(await page.locator('[data-place-here-label]').first().textContent()).toBe('Place here');
	for (const other of ['#piecies-player', '#zone-opponent', '#piecies-opponent']) {
		expect(await page.locator(`${other} [data-place-here]`).count(), `no hint in ${other}`).toBe(0);
	}
	const look = await mosjeHint.evaluate((el) => {
		const cs = getComputedStyle(el);
		return { style: cs.borderTopStyle, color: cs.borderTopColor, shadow: cs.boxShadow, animation: cs.animationName, pointerEvents: cs.pointerEvents };
	});
	expect(look.style, 'hinted border style').toBe('solid');
	expect(look.color, 'hinted border colour is the gold accent').toBe('rgb(232, 185, 79)');
	expect(look.shadow, 'hinted slot glows').not.toBe('none');
	expect(look.animation, 'static glow, no pulse (D-09)').toBe('none');
	expect(look.pointerEvents, 'the slot stays inert').toBe('none');
	expect(await readPaintOverflow(page, '#board-root [data-place-here]'), 'the hint glow stays inside every clip (D-03)').toEqual([]);

	// b. D-12: the label is drawn over the raised hand card.
	await page.waitForTimeout(400); // the raised card's lift transition settles
	await expectLabelOnTop(page, 'Mosje case 1920x1080');
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/slot-place-here-1920x1080.png` });

	// c. A raised Piecie marks the first free own Piecie slot (1); the hint moves and clears.
	await away(page);
	expect(await hint(page).count(), 'hint cleared when the pointer leaves').toBe(0);
	expect(await page.locator('[data-place-here-label]').count(), 'label cleared when the pointer leaves').toBe(0);
	await raise(page, DONER);
	await expect.poll(() => hint(page).count(), 'hint while the Piecie card is raised').toBe(1);
	expect(await hint(page).getAttribute('data-slot-kind')).toBe('piecie');
	expect(await hint(page).getAttribute('data-slot-index')).toBe('1');
	expect(await hint(page).evaluate((el) => !!el.closest('#piecies-player')), 'inside my Piecie row').toBe(true);
	expect(await page.locator('#zone-player [data-place-here]').count(), 'no hint on the Mosje row').toBe(0);
	await page.waitForTimeout(400);
	await expectLabelOnTop(page, 'Piecie case 1920x1080');
	await away(page);
	expect(await hint(page).count()).toBe(0);

	// d. Not hover-only: an HTML5 drag shows the hint with the pointer away, and dragend clears it.
	const dt = await page.evaluateHandle(() => new DataTransfer());
	await wrapOf(page, FISSA).dispatchEvent('dragstart', { dataTransfer: dt });
	await expect.poll(() => hint(page).count(), 'hint during a drag').toBe(1);
	expect(await hint(page).getAttribute('data-slot-kind')).toBe('mosje');
	expect(await hint(page).getAttribute('data-slot-index')).toBe('0');
	await wrapOf(page, FISSA).dispatchEvent('dragend', { dataTransfer: dt });
	await expect.poll(() => hint(page).count(), 'hint cleared by dragend').toBe(0);

	// e. A card that cannot be paid goes nowhere; a Piecie from the hand is free.
	await setEnergy(page, 'player_1', 1);
	await raise(page, FISSA);
	await page.waitForTimeout(300);
	expect(await hint(page).count(), 'a Mosje that costs more than the Energy pool shows no hint').toBe(0);
	await raise(page, DONER);
	await expect.poll(() => hint(page).count(), 'a free Piecie still shows the hint').toBe(1);
	await away(page);
	await setEnergy(page, 'player_1', 6);

	// f. No free slot of that kind: no hint.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 20 });
	await raise(page, FISSA);
	await page.waitForTimeout(300);
	expect(await hint(page).count(), 'a full Mosje row shows no hint').toBe(0);
	await away(page);
	await setMosjeOnField(page, 'player_1', 0, null);
	await page.mouse.move(2, 2);
	await page.waitForTimeout(500);

	// g. It lands where it said. The Piecie goes first (it opens no prompt).
	await raise(page, DONER);
	await expect.poll(() => hint(page).count()).toBe(1);
	const piecieIndex = Number(await hint(page).getAttribute('data-slot-index'));
	expect(piecieIndex, 'the Piecie hint marks slot 1').toBe(1);
	await playCardFromHand(page, DONER);
	await expect.poll(async () => (await getGameState(page)).players.player_1.piecieSlots[piecieIndex]?.cardId, 'engine: the Piecie sits in the marked slot').toBe(DONER);
	expect(await page.locator(`#piecies-player [data-zone="piecie"][data-slot-index="${piecieIndex}"]`).count(), 'the Piecie tile shows in the marked slot').toBe(1);
	await away(page);

	await raise(page, FISSA);
	await expect.poll(() => hint(page).count()).toBe(1);
	const mosjeIndex = Number(await hint(page).getAttribute('data-slot-index'));
	expect(mosjeIndex, 'the Mosje hint marks slot 0').toBe(0);
	await playCardFromHand(page, FISSA);
	await expect.poll(async () => (await getGameState(page)).players.player_1.activeSlots[mosjeIndex]?.cardId, 'engine: the Mosje sits in the marked slot').toBe(FISSA);
	await expect(page.locator(`#zone-player [data-zone="mosje"][data-slot-index="${mosjeIndex}"][data-card-id="${FISSA}"]`)).toBeVisible();
	await away(page);
	expect(await hint(page).count(), 'nothing is marked after the plays').toBe(0);
	expect(await page.locator('[data-place-here-label]').count(), 'no label is left behind').toBe(0);
});

test('D-08/D-12: at 1920x950 the hint marks the right slot, stays inside the board and is drawn over the raised card', async ({ page }) => {
	test.setTimeout(90000);
	await seed(page, { width: 1920, height: 950 });

	await raise(page, FISSA);
	await expect.poll(() => hint(page).count(), 'hint while the Mosje card is raised').toBe(1);
	expect(await hint(page).getAttribute('data-slot-kind')).toBe('mosje');
	expect(await hint(page).getAttribute('data-slot-index')).toBe('0');
	await page.waitForTimeout(400);
	await expectLabelOnTop(page, 'Mosje case 1920x950');
	expect(await readPaintOverflow(page, '#board-root [data-place-here]'), 'hint glow inside every clip at 1920x950').toEqual([]);
	await away(page);

	await raise(page, DONER);
	await expect.poll(() => hint(page).count(), 'hint while the Piecie card is raised').toBe(1);
	expect(await hint(page).getAttribute('data-slot-kind')).toBe('piecie');
	expect(await hint(page).getAttribute('data-slot-index')).toBe('1');
	await page.waitForTimeout(400);
	await expectLabelOnTop(page, 'Piecie case 1920x950');
	await away(page);

	expect(await hint(page).count()).toBe(0);
	expect(await readPaintOverflow(page, '#board-root .board-slot--empty'), 'empty slots inside every clip at 1920x950').toEqual([]);
});
