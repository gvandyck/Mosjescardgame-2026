// Phase 51: hand-card hover animation smoothness. Measures frame times while the pointer sweeps
// across a full hand (hover lift + rainbow glow ring). Reproduces the "choppy / stiff" report.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

async function measureHoverSweep(page) {
	return page.evaluate(async () => {
		const wraps = [...document.querySelectorAll('.hand-card-wrap')];
		const frames = [];
		let last = performance.now(); let running = true;
		const tick = (t) => { frames.push(t - last); last = t; if (running) requestAnimationFrame(tick); };
		requestAnimationFrame(tick);
		// Sweep the mouse over the hand by dispatching real-looking pointer moves is not possible from JS;
		// the caller moves the real mouse. This only records frames for the given duration.
		await new Promise((r) => setTimeout(r, 3500));
		running = false;
		const f = frames.slice(5).sort((a, b) => a - b);
		const pct = (p) => f[Math.min(f.length - 1, Math.floor(f.length * p))];
		return { n: f.length, avg: f.reduce((s, x) => s + x, 0) / f.length, p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: f[f.length - 1], over25: f.filter((x) => x > 25).length, over40: f.filter((x) => x > 40).length, wraps: wraps.length };
	});
}

test('hand hover sweep: frame times', async ({ page }) => {
	await page.setViewportSize({ width: Number(process.env.PERF_W) || 1600, height: Number(process.env.PERF_H) || 900 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['mosje_hacker', 'piecie_call_of_welloes', 'snelle_lucky_coin', 'place_the_gym', 'piecie_warm_kannetje_melk', 'mosje_chris_ddr', 'piecie_leipe_swap']));
	await page.waitForTimeout(1200);
	const measuring = measureHoverSweep(page);
	for (let pass = 0; pass < 3; pass += 1) {
		for (let x = 150; x <= 1450; x += 25) { await page.mouse.move(x, 840); await page.waitForTimeout(20); }
		for (let x = 1450; x >= 150; x -= 25) { await page.mouse.move(x, 840); await page.waitForTimeout(20); }
	}
	const stats = await measuring;
	fs.writeFileSync(process.env.PERF_OUT || '_perf.out', JSON.stringify(stats));
	console.log('HAND PERF', JSON.stringify(stats));
	expect(stats.p95, 'p95 frame time (ms)').toBeLessThan(25);
});
