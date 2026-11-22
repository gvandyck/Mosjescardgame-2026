/**
 * phone-pwa.spec.js - Phase 72.1-11 (D-14, MOB-07): Add to Home Screen, proved in a real Chromium on both pages (lobby and game).
 * Chromium's own manifest parser (CDP Page.getAppManifest) reports no error; the parsed manifest is standalone, portrait, relative
 * start_url and scope, three PNG icons that answer 200 image/png with the declared pixel size (read from the PNG header); theme-color,
 * apple-touch-icon and viewport-fit=cover are present; there is no service worker. Page.getInstallabilityErrors is read and printed
 * as REPORT; the spec fails only on manifest / icon / url ids, never on a service-worker or fetch-handler id (D-14: no service worker).
 */
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../../helpers/servePlaceholderFirebase.js';
import { PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from '../helpers.js';

// Installability ids that mean the manifest or an icon is wrong (service-worker ids are reported, never asserted).
const BLOCKING_ID = /manifest|icon|start-url|scope|display|name/i;
const SERVICE_WORKER_ID = /service-worker|fetch-handler|worker/i;

function pngSize(buffer) {
	const signature = buffer.subarray(0, 8).toString('hex');
	if (signature !== '89504e470d0a1a0a') return null;
	return { w: buffer.readUInt32BE(16), h: buffer.readUInt32BE(20) };
}

async function checkPage(page, label) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Page.enable');
	const { url, errors, data } = await cdp.send('Page.getAppManifest');
	expect(errors, `${label}: manifest errors`).toEqual([]);
	expect(url, `${label}: manifest url`).toMatch(/\/manifest\.webmanifest$/);
	const manifest = JSON.parse(data);
	expect(manifest.display).toBe('standalone');
	expect(manifest.orientation).toBe('portrait');
	expect(manifest.start_url).toMatch(/^\.?\/?$/);
	expect(manifest.scope).toMatch(/^\.?\/?$/);

	const pngs = manifest.icons.filter(i => i.type === 'image/png');
	expect(pngs, `${label}: PNG icons`).toHaveLength(3);
	for (const icon of pngs) {
		const res = await page.request.get(new URL(icon.src, url).href);
		expect(res.status(), `${icon.src} status`).toBe(200);
		expect(res.headers()['content-type'], `${icon.src} type`).toMatch(/^image\/png/);
		const [declW, declH] = icon.sizes.split('x').map(Number);
		expect(pngSize(await res.body()), `${icon.src} pixel size`).toEqual({ w: declW, h: declH });
	}

	const meta = await page.evaluate(() => ({
		theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
		touchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ?? null,
		viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '',
		linked: document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? null,
		workers: 0,
	}));
	meta.workers = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
	expect(meta.linked, `${label}: manifest link`).toBeTruthy();
	expect(meta.theme).toBeTruthy();
	expect(meta.touchIcon).toBeTruthy();
	expect(meta.viewport).toContain('viewport-fit=cover');
	expect(meta.workers, `${label}: no service worker`).toBe(0);

	const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
	const ids = installabilityErrors.map(e => e.errorId);
	console.log(`REPORT installability ${label}: ${ids.length ? ids.join(', ') : '(none)'}`);
	const blocking = ids.filter(id => BLOCKING_ID.test(id) && !SERVICE_WORKER_ID.test(id));
	expect(blocking, `${label}: manifest or icon installability errors`).toEqual([]);
}

test.describe('Add to Home Screen at 395x731', () => {
	test.use(phoneUse(PIXEL_VIEWPORT));

	test('lobby page: manifest, icons, meta tags', async ({ page }) => {
		await servePlaceholderFirebase(page);
		await page.goto('/');
		await page.locator('#lobby2-start').waitFor({ timeout: 15000 });
		await checkPage(page, 'index.html');
	});

	test('game page: manifest, icons, meta tags', async ({ page }) => {
		await seedOfflineSession(page);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);
		await checkPage(page, 'game.html');
	});
});
