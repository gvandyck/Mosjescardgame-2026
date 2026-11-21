/**
 * screens-2-1-sweep.spec.js - Phase 72-17 (D-18, D-19, NUI-01 to NUI-06): one sweep of every Phase 72 screen in the real game at
 * 1920x1080, one test per requirement, each from a fresh seeded game (testMode hooks). It does not repeat the per-plan specs
 * (attachment-tiles, timed-effect-tags, attack-preview-breakdown, game-over-2-0, ...): it proves the screens work in one session
 * and that none of them breaks the page width. It never needs a bot game to end: the win is forced through the real Personal Quest UI.
 * Headless at 1920x1080 (the Playwright "visual" project is headed: run this file through a temp config).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';
import { forceHumanPersonalQuestWin } from '../helpers/forceHumanPersonalQuestWin.js';
import { attackByTap } from '../helpers/boardTaps.js';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection, setHand, setEnergy, setQuestFaceUp,
} from './helpers.js';
import { PERSONAL_QUESTS } from '../../src/data/personalQuests.js';
import { getDeckTileLists } from '../../src/ui/lobby/getDeckTileLists.js';
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const SHOT_DIR = '.planning/phases/72-screens-for-the-new-design/shots';
const PQ = PERSONAL_QUESTS.find(q => q.id === 'pq_charge');
// The same code points tests/ui/no-glyphs-in-ui-2-1.test.ts bans in the source.
const BANNED = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{27BF}\u{2B50}\u{2190}-\u{21FF}\u{FE0F}]/u;

const hook = (page, name, ...args) => page.evaluate(({ name, args }) => window.__testHooks[name](...args), { name, args });
const noPageScroll = async (page, where) => {
	const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
	expect(m.sw, `${where}: no horizontal page scroll (scrollWidth ${m.sw} vs clientWidth ${m.cw})`).toBeLessThanOrEqual(m.cw);
};
const at1080p = (page) => expect(page.viewportSize()).toEqual({ width: 1920, height: 1080 });
const own = (page, cardId) => page.locator(`.board-zone--player .card[data-card-id="${cardId}"]`).first();

let problems;
test.beforeEach(async ({ page }) => {
	await servePlaceholderFirebase(page);
	problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
});
test.afterEach(() => {
	expect(problems, 'no page error').toEqual([]);
});

// Own Alyssa (Physical) + Fissa on slots 0 and 1; the bot has Coert (Digital) and Ming (Creative); hands set by the caller.
async function bootBoard(page, { level = 3 } = {}) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_coert_tech', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ming_natural', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', 3);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out');
}

test('NUI-01: the hand Personal Quest face shows Needs / Pay / Roll; a tap opens the detail with Play and, when off, the reason', async ({ page }) => {
	at1080p(page);
	await bootBoard(page, { level: 1 });
	await setHand(page, 'player_1', [PQ.id]);
	const face = page.locator(`.hand-card[data-card-id="${PQ.id}"]`);
	await expect(face).toBeVisible();
	const blocks = await face.locator('[data-cv1-pq-block]').evaluateAll(els => els.map(el => [el.getAttribute('data-cv1-pq-block'), el.textContent]));
	expect(blocks.map(b => b[0])).toEqual(['needs', 'pay', 'roll']);
	for (const [key, text] of blocks) {
		const printed = PQ[`${key}Text`];
		expect(text.replace(/\s+/g, ' ').toLowerCase(), `${key} block holds the printed text`).toContain(printed.replace(/\s+/g, ' ').toLowerCase());
	}

	// Level 1 only: Play is off and the reason is on the detail.
	await face.dispatchEvent('click');
	const play = page.locator('.card-detail .cd-actions button[data-action-id="play"]');
	await expect(play).toBeVisible();
	await expect(play).toBeDisabled();
	await expect(page.locator('.card-detail .cd-why')).toContainText('You have no Level 3 Mosje');
	await page.locator('#modal-close-preview').click();

	// A Level 3 Mosje of its type: Play is on, no reason.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
	await clearEntryProtection(page);
	await hook(page, 'setTurnNumber', 3);
	await face.dispatchEvent('click');
	await expect(page.locator('.card-detail .cd-actions button[data-action-id="play"]')).toBeEnabled();
	await expect(page.locator('.card-detail .cd-why')).toHaveCount(0);
	await noPageScroll(page, 'board with the detail open');
});

test('NUI-02: an attachment shows as a chip on the Mosje tile and a timed effect as a tag line', async ({ page }) => {
	at1080p(page);
	await bootBoard(page);
	await setHand(page, 'player_1', []);
	await expect(page.locator('.tile-chips')).toHaveCount(0);
	await expect(page.locator('.tile-tags')).toHaveCount(0);
	await hook(page, 'attachToMosje', 'player_1', 0, 'piecie_dumbbells');
	await hook(page, 'addTimedEffect', 'player_1', 0, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
	const tile = own(page, 'mosje_alyssa_bulldozer');
	await expect(tile.locator('.tile-chips .chip')).toHaveText(['Dumbbells']);
	await expect(tile.locator('.tile-tags .tag-line:not(.tag-line--more)')).toHaveText(['+10 Power until end of next turn']);
	await expect(own(page, 'mosje_alyssa_fissa').locator('.tile-chips')).toHaveCount(0);
	await noPageScroll(page, 'board with chips and tags');
});

test('NUI-03: the attack shows its breakdown lines before Confirm and Confirm costs the shown total', async ({ page }) => {
	test.setTimeout(90000);
	at1080p(page);
	await bootBoard(page);
	await setHand(page, 'player_1', []);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await page.mouse.move(2, 2);
	const { tapOwnCard, chooseTray, targetTile, statusStrip } = await import('../helpers/boardTaps.js');
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await statusStrip(page).locator('[data-cancel]').waitFor({ state: 'visible', timeout: 5000 });
	await targetTile(page, 'player_2:0').click();
	await page.locator('#status-strip[data-status-kind="preview"]').waitFor({ timeout: 5000 });
	const lines = await statusStrip(page).locator('.strip-line').allTextContents();
	expect(lines[0]).toBe('Power 20');
	expect(lines.some(l => l.startsWith('Triangle +10'))).toBe(true); // Physical beats Digital
	expect(lines.some(l => l.startsWith('Resilient'))).toBe(true);
	expect(lines.find(l => l.startsWith('='))).toBe('= 25 before card effects');
	await expect(statusStrip(page).locator('[data-confirm]')).toBeVisible();
	const before = (await hook(page, 'getGameState')).players.player_2.activeSlots[0].mp;
	await statusStrip(page).locator('[data-confirm]').click();
	await expect.poll(async () => (await hook(page, 'getGameState')).players.player_2.activeSlots[0].mp).toBe(before - 25);
});

test('NUI-04: no emoji or pictograph in the hand, the field tiles, the log and the open detail, and no HOLD or Graveyard text', async ({ page }) => {
	test.setTimeout(90000);
	at1080p(page);
	await bootBoard(page);
	await setHand(page, 'player_1', [PQ.id, 'piecie_kannetje_melk', 'snelle_ff_haaltje_nemen', 'place_the_gym', 'mosje_youri']);
	await hook(page, 'attachToMosje', 'player_1', 0, 'piecie_dumbbells');
	await hook(page, 'addTimedEffect', 'player_1', 1, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
	await attackByTap(page); // a log row about a fight
	await setHand(page, 'player_1', [PQ.id, 'piecie_kannetje_melk', 'snelle_ff_haaltje_nemen', 'place_the_gym', 'mosje_youri']);

	const read = (selector) => page.evaluate((s) => [...document.querySelectorAll(s)].map(el => el.textContent).join('\n'), selector);
	const log = await read('#log-root .log-row');
	expect(log.trim().length, 'the log has rows').toBeGreaterThan(0);
	const parts = {
		hand: await read('.game-hand-panel'),
		'my field': await read('.board-zone--player'),
		'their field': await read('.board-zone--opponent'),
		log,
	};
	await page.locator(`.hand-card[data-card-id="${PQ.id}"]`).dispatchEvent('click');
	await expect(page.locator('.card-detail')).toBeVisible();
	parts.detail = await read('.card-detail');
	// The die symbol in a Personal Quest's printed Roll line is card text (handover/cards.json, src/data/personalQuests.js), not screen
	// chrome: the printed Roll lines are taken out of the text first, everything else must be free of glyphs.
	const printed = PERSONAL_QUESTS.map(q => q.rollText).filter(Boolean);
	const withoutPrintedRolls = (text) => printed.reduce((t, roll) => t.split(roll).join(''), text);
	for (const [where, raw] of Object.entries(parts)) {
		const text = withoutPrintedRolls(raw);
		expect(text, `${where} has no emoji or pictograph`).not.toMatch(BANNED);
		expect(text, `${where} has no HOLD`).not.toMatch(/\bHOLD\b/);
		expect(text, `${where} has no Graveyard`).not.toMatch(/Graveyard/i);
	}
});

test('NUI-05: the lobby shows three deck tiles with their lists, and a Personal Quest win shows the game-over card with the dice', async ({ page }) => {
	test.setTimeout(120000);
	at1080p(page);
	await page.goto('/');
	await expect(page.locator('[data-picker="mode"]')).toBeVisible();
	const tiles = page.locator('[data-picker="player-deck"] .deck-tile');
	await expect(tiles).toHaveCount(3);
	for (const deck of getPlayerFacingDecks()) {
		const lists = getDeckTileLists(deck);
		const tile = page.locator(`[data-picker="player-deck"] .deck-tile[data-deck-id="${deck.id}"]`);
		await expect(tile.locator('.deck-tile__mosjes .deck-tile__item')).toHaveText(lists.mosjeNames);
		await expect(tile.locator('.deck-tile__quests .deck-tile__item')).toHaveText(lists.personalQuestNames);
	}

	await seedOfflineSession(page, 'STARTER_PHYSICAL', 'STARTER_DIGITAL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await forceHumanPersonalQuestWin(page);
	await expect(page.locator('.reward-title')).toHaveText('Victory!');
	await expect(page.locator('.go-winning-quest .card-v1')).toContainText(PQ.name);
	const won = await hook(page, 'getGameState');
	expect(won.winningQuest.dice.length).toBeGreaterThan(0);
	await expect(page.locator('.go-winning-quest .die')).toHaveText(won.winningQuest.dice.map(String));
});

test('NUI-06: 1920x1080 has no horizontal page scroll on the lobby, the board and the game-over screen', async ({ page }) => {
	test.setTimeout(120000);
	at1080p(page);
	await page.goto('/');
	await expect(page.locator('[data-picker="mode"]')).toBeVisible();
	await noPageScroll(page, 'lobby');

	await seedOfflineSession(page, 'STARTER_PHYSICAL', 'STARTER_DIGITAL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await noPageScroll(page, 'board');
	await forceHumanPersonalQuestWin(page);
	await expect(page.locator('#reward-overlay')).toBeVisible();
	await page.waitForTimeout(600);
	await noPageScroll(page, 'game over');
});

test('final board screenshot: a Personal Quest in hand, a Mosje with a chip and a tag line, and the log', async ({ page }) => {
	test.setTimeout(90000);
	at1080p(page);
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await bootBoard(page);
	await hook(page, 'attachToMosje', 'player_1', 0, 'piecie_dumbbells');
	await hook(page, 'addTimedEffect', 'player_1', 0, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
	await attackByTap(page);
	await setHand(page, 'player_1', [PQ.id, 'piecie_kannetje_melk', 'snelle_ff_haaltje_nemen']);
	await expect(own(page, 'mosje_alyssa_bulldozer').locator('.tile-chips .chip')).toHaveCount(1);
	await expect(own(page, 'mosje_alyssa_bulldozer').locator('.tile-tags .tag-line')).toHaveCount(1);
	await page.locator('#btn-toggle-log').click(); // the log lives in the Battle Log popover
	await expect(page.locator('#topbar-log-popover')).toBeVisible();
	await expect(page.locator('#log-root .log-row').first()).toBeVisible();
	await page.mouse.move(2, 2);
	await page.waitForTimeout(900);
	await page.screenshot({ path: `${SHOT_DIR}/72-17-final-board.png` });
});
