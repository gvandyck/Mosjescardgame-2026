// card-tiers.spec.js — Phase 50 rarity tiers in a real browser.
// Renders real cards through renderCard on the demo page (?tiers=all), plus the
// deck builder preview and the offline game hand. Runs in "visual" and "tiers-webkit".
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from './helpers.js';

const DEMO = '/card-tiers-demo.html?tiers=all';
const ACCENT = {
	FIGHTING: 'rgb(194, 65, 12)', DIGITAL: 'rgb(14, 116, 144)', ARTISTIC: 'rgb(162, 28, 175)',
	PIECIE: 'rgb(21, 128, 61)', PLACE: 'rgb(109, 40, 217)', SNELLE: 'rgb(161, 98, 7)',
};
const TYPES = ['FIGHTING', 'DIGITAL', 'ARTISTIC', 'PIECIE', 'PLACE', 'SNELLE'];
const COMBOS = TYPES.flatMap((type) => [1, 2, 3, 4, 5].map((tier) => ({
	type, tier, accent: ACCENT[type],
	pill: ['FIGHTING', 'DIGITAL', 'ARTISTIC'].includes(type) ? /^LVL \d+$/ : new RegExp(`^${type}$`),
	layout: tier >= 4 ? 'card--fullart' : 'card--boxed',
	badge: type !== 'PLACE',
})));

// Renders one card of `type` at `tier` and `width` into a fixture; returns nothing.
async function mount(page, { type, tier, width = 440, opts = {}, patch = {}, id = 'fx' }) {
	await page.evaluate(async ({ type, tier, width, opts, patch, id }) => {
		const [{ renderCard }, { MOSJES }, { PIECIES }, { PLACES }, { SNELLE_PIECIES }] = await Promise.all([
			import('/src/ui/cardRenderer.js'), import('/src/data/mosjes.js'), import('/src/data/piecies.js'),
			import('/src/data/places.js'), import('/src/data/snellePiecies.js'),
		]);
		const art = (c) => c.artPath && !String(c.artPath).endsWith('/placeholder.png');
		const pick = (l, f = () => true) => l.find((c) => f(c) && art(c)) || l.find(f);
		const src = { PIECIE: () => pick(PIECIES), PLACE: () => pick(PLACES), SNELLE: () => pick(SNELLE_PIECIES) }[type]
			?.() ?? (patch.__fourTraits
				? MOSJES.reduce((a, b) => (Object.keys(b.traits || {}).length > Object.keys(a.traits || {}).length ? b : a))
				: pick(MOSJES, (c) => String(c.subtype).toUpperCase() === type));
		const { __fourTraits, ...rest } = patch;
		document.getElementById(id)?.remove();
		const host = document.createElement('div');
		host.id = id;
		host.style.cssText = 'position:absolute;left:0;top:0;padding:0;z-index:99;background:#000';
		const el = renderCard({ ...src, ...rest, rarity: '★'.repeat(tier) }, opts);
		el.style.setProperty('--cv1-w', `${width}px`);
		host.append(el);
		document.body.prepend(host);
	}, { type, tier, width, opts, patch, id });
	return page.locator(`#${id} > .card`);
}

async function rel(card, sel) {
	return card.evaluate((c, s) => {
		const el = c.querySelector(s);
		if (!el) return null;
		const a = c.getBoundingClientRect(); const b = el.getBoundingClientRect();
		return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height, r: a.right - b.right, b: a.bottom - b.bottom };
	}, sel);
}

test.describe('Phase 50 rarity tiers', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1400, height: 1000 });
		await page.goto(DEMO);
		await page.waitForSelector('#tier-grid .card');
	});

	for (const c of COMBOS) {
		test(`combo ${c.type} tier ${c.tier}`, async ({ page }) => {
			const card = await mount(page, c);
			await expect(card).toHaveAttribute('data-tier', String(c.tier));
			await expect(card).toHaveClass(new RegExp(c.layout));
			await expect(card.locator('.ct-diamond--lit')).toHaveCount(c.tier);
			const bg = await card.locator('.ct-diamond--lit').first().evaluate((e) => getComputedStyle(e).backgroundColor);
			expect(bg).toBe(c.accent);
			expect((await card.locator('.cv1-pill').innerText()).trim()).toMatch(c.pill);
			await expect(card.locator('.cv1-badge')).toHaveCount(c.badge ? 1 : 0);
			if (c.badge) {
				const s = await card.locator('.cv1-badge').evaluate((e) => {
					const cs = getComputedStyle(e);
					return [cs.backgroundColor, cs.borderTopWidth, cs.boxShadow];
				});
				expect(s).toEqual(['rgba(0, 0, 0, 0)', '0px', 'none']);
			}
		});
	}

	test('tier 4+5 window: even 18u frame at 440/240/160', async ({ page }) => {
		for (const type of TYPES) {
			for (const w of [440, 240, 160]) {
				for (const tier of [4, 5]) {
				const card = await mount(page, { type, tier, width: w });
				const r = await rel(card, '.cv1-window');
				const u = 18 * w / 440;
				for (const v of [r.x, r.y, r.r, r.b]) expect(Math.abs(v - u)).toBeLessThanOrEqual(0.6);
				}
			}
		}
	});

	test('text, pill, label and badge boxes identical across tiers', async ({ page }) => {
		const SELS = ['.cv1-name', '.cv1-nick', '.cv1-info', '.cv1-pill', '.cv1-border-text', '.cv1-badge'];
		for (const type of TYPES) {
			const boxes = [];
			for (let tier = 1; tier <= 5; tier += 1) {
				const card = await mount(page, { type, tier });
				boxes.push(await Promise.all(SELS.map((s) => rel(card, s))));
			}
			for (let t = 1; t < 5; t += 1) {
				SELS.forEach((s, i) => {
					const a = boxes[0][i]; const b = boxes[t][i];
					expect(!!a, `${type} ${s}`).toBe(!!b);
					// Tier 4 (full art) has more left/right text padding on purpose, so only compare vertical position and height there.
					if (a) for (const k of (t >= 3 ? ['y', 'h'] : ['x', 'y', 'w', 'h'])) expect(Math.abs(a[k] - b[k]), `${type} ${s} ${k} tier ${t + 1}`).toBeLessThanOrEqual(1);
				});
			}
		}
	});

	test('edge cases: 4-trait Mosje, Place info, art-less card', async ({ page }) => {
		for (const tier of [1, 2, 3, 4, 5]) {
			let card = await mount(page, { type: 'FIGHTING', tier, patch: { __fourTraits: true } });
			const info = await rel(card, '.cv1-info');
			const badge = await rel(card, '.cv1-badge');
			expect(info.x + info.w).toBeLessThanOrEqual(330.5);
			expect(info.x + info.w).toBeLessThanOrEqual(badge.x);
			card = await mount(page, { type: 'PLACE', tier });
			expect((await rel(card, '.cv1-info')).r).toBeLessThan(110 - 0.5);
		}
		for (const tier of [1, 4]) {
			const card = await mount(page, { type: 'PIECIE', tier, patch: { artPath: null } });
			await expect(card.locator('img.cv1-art')).toHaveCount(0);
			await expect(card.locator('.cv1-window')).toBeVisible();
		}
	});

	test('field tiles have no tier chrome and same box as untiered E1', async ({ page }) => {
		const ref = await mount(page, { type: 'FIGHTING', tier: 1, opts: { fieldMode: true }, patch: { rarity: undefined } });
		await ref.evaluate((e) => e.style.removeProperty('--cv1-w'));
		const refBox = await ref.boundingBox();
		for (const tier of [1, 2, 3, 4, 5]) {
			const card = await mount(page, { type: 'FIGHTING', tier, opts: { fieldMode: true } });
			await card.evaluate((e) => e.style.removeProperty('--cv1-w'));
			await expect(card.locator('[class*="ct-"]')).toHaveCount(0);
			const b = await card.boundingBox();
			expect(Math.abs(b.width - refBox.width)).toBeLessThanOrEqual(0.5);
			expect(Math.abs(b.height - refBox.height)).toBeLessThanOrEqual(0.5);
		}
	});

	test('small renders (<120px) hide side text and glints', async ({ page }) => {
		await page.evaluate(async () => (await import('/src/ui/cardTierMotion.js')).initCardTierMotion());
		const card = await mount(page, { type: 'PIECIE', tier: 5, width: 100 });
		await expect(card).toHaveClass(/card--tier-small/);
		await expect(card.locator('.ct-side').first()).toBeHidden();
		await expect(card.locator('.ct-glint').first()).toBeHidden();
	});
});

test('reduced motion: holo and foil do not animate', async ({ browser }) => {
	const ctx = await browser.newContext({ reducedMotion: 'reduce' });
	const page = await ctx.newPage();
	await page.goto(DEMO);
	await page.waitForSelector('#tier-grid .card');
	const names = await page.evaluate(() => [
		getComputedStyle(document.querySelector('.ct-holo')).animationName,
		getComputedStyle(document.querySelector('.ct-foil-anim')).animationName,
	]);
	expect(names).toEqual(['none', 'none']);
	await ctx.close();
});

test('deck builder preview renders a tier card face', async ({ page }) => {
	// The real deck builder redirects to login without an account, so block its
	// script and open the same preview path (modalManager.showCardPreview) on the
	// deck-builder.html page itself: this checks its stylesheet links.
	await page.route('**/src/deck-builder.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
	await page.goto('/deck-builder.html');
	await page.evaluate(async () => {
		const [{ initModalManager }, { MOSJES }] = await Promise.all([
			import('/src/ui/modalManager.js'), import('/src/data/mosjes.js')]);
		const root = document.createElement('div');
		root.id = 'modal-root';
		root.className = 'modal-root';
		document.body.append(root);
		initModalManager(root).showCardPreview({ ...MOSJES[0], rarity: '★★★★' });
	});
	const card = page.locator('.cd-preview .card').first();
	await expect(card).toHaveClass(/card-v1/);
	await expect(card).toHaveAttribute('data-tier', '4');
	const b = await card.boundingBox();
	console.log('deck-builder preview box', JSON.stringify(b));
	await page.waitForTimeout(600);
	await page.screenshot({ path: '.planning/phases/50-rarity-tier-card-redesign-4-tiers-boxed-full-art/shots-50-05/deck-builder-preview.png' });
	expect(Math.abs(b.height / b.width - 1.5)).toBeLessThan(0.02);
});

test('in-game hand: tier cards are static', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	const ids = await page.evaluate(async () => {
		const [{ MOSJES }, { PIECIES }] = await Promise.all([import('/src/data/mosjes.js'), import('/src/data/piecies.js')]);
		const all = [...MOSJES, ...PIECIES];
		return [1, 2, 3, 4, 5].map((t) => all.find((c) => String(c.rarity || '').length === t)?.id).filter(Boolean);
	});
	await page.evaluate((list) => window.__testHooks.setHand('player_1', list), ids);
	const cards = page.locator('#hand-root .card');
	await expect(cards.first()).toBeVisible();
	await page.waitForTimeout(300);
	const tiers = await cards.evaluateAll((els) => els.map((e) => e.dataset.tier));
	expect(tiers.length).toBeGreaterThan(0);
	for (const t of tiers) expect(t).toMatch(/[1-5]/);
	await expect(page.locator('#hand-root .card--tier-anim')).toHaveCount(0);
	await page.screenshot({ path: '.planning/phases/50-rarity-tier-card-redesign-4-tiers-boxed-full-art/shots-50-05/in-game-hand.png' });
});
