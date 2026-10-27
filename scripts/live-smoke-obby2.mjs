// live-smoke-obby2.mjs - REPORT-ONLY smoke of a deployed Obby 2.0 site (64-07, D-38). Read-only: one headless visit, no credentials.
// Usage: node scripts/live-smoke-obby2.mjs [baseUrl]    (default https://eightytwenty.nl/obbycardgame2/)
// Checks at 1920x1080: the lobby loads, shows version 2.0-..., robots noindex, 2 modes, 3 deck tiles, and Start opens a real game.
// Prints ONE JSON report with verdict PASS or FAIL and always exits 0: the verdict is information for the person who deployed, never a gate.
// scripts/** is not deployed (deploy-obby2.yml exclude list).
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] || 'https://eightytwenty.nl/obbycardgame2/';
const consoleErrors = [];
const pageErrors = [];
const report = { url: baseUrl, version: null, robots: null, modes: 0, tiles: 0, gameStarted: false, consoleErrors, pageErrors, verdict: 'FAIL' };

function judge(r) {
  const clean = r.consoleErrors.length === 0 && r.pageErrors.length === 0;
  const ok = String(r.version).startsWith('2.0-') && String(r.robots).includes('noindex') && r.modes === 2 && r.tiles === 3 && r.gameStarted && clean;
  return ok ? 'PASS' : 'FAIL';
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(baseUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('[data-picker="player-deck"] .deck-tile', { timeout: 15000 });
  report.version = (await page.locator('#app-version').innerText()).replace(/^Version\s+/i, '').trim();
  report.robots = await page.locator('meta[name="robots"]').getAttribute('content');
  report.modes = await page.locator('[data-picker="mode"] [role="radio"]').count();
  report.tiles = await page.locator('[data-picker="player-deck"] .deck-tile').count();

  await page.locator('#lobby2-start').click();
  await page.waitForURL(/game\.html/, { timeout: 20000 });
  await page.locator('.mosje-card--owned').first().waitFor({ state: 'attached', timeout: 20000 });
  report.gameStarted = true;
} catch (err) {
  report.error = String(err.message).split('\n')[0];
} finally {
  if (browser) await browser.close();
}
report.verdict = judge(report);
console.log(JSON.stringify(report, null, 2));
process.exit(0);
