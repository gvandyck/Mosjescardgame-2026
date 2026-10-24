/**
 * attack-action.spec.js - U2: the tap-first action tray, attack targeting with preview + Confirm, and Quest choosing on the
 * Quest tiles (UI-05, Phase 63-05, D-03..D-06). Every step is a real tap on the live board; the only hooks are the testMode
 * seeders (board, hands, face-up Quest, forced dice). Saves tests/ui/screenshots/board-2-0/u2-*.png.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, setHand, setQuestFaceUp, setNextDice,
	setEnergy, unlockPiecies, playCardFromHand, readOpponentMosjes, readOwnedMosjes,
} from './helpers.js';
import {
	tapOwnCard, chooseTray, attackByTap, questByTap, abilityByTap, activateByTap, ownTile, targetTile, statusStrip,
} from '../helpers/boardTaps.js';
import { buildAttackPreview } from '../../src/ui/board/buildAttackPreview.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';
// A hand of Piecies only: a Snelle in a hand would open a reaction window (or reroll the forced Quest dice) at random.
const HAND = ['piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_ronald_kip', 'piecie_chefs_special', 'piecie_momentum_boost'];

// Own Alyssa (Power 20, slot 0); opponent slot 0 = fresh Ming, slot 1 = Ronald (not fresh, 40 MP) unless `bothOpen`.
async function boot(page, { bothOpen = false } = {}) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, null);
	await setMosjeOnField(page, 'player_2', 0, 'mosje_ming_natural', { mp: 40, level: 1, entryProtected: !bothOpen });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ronald_chef', { mp: 40, level: 1 });
	await setHand(page, 'player_1', HAND);
	await setHand(page, 'player_2', []);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	await page.mouse.move(2, 2);
}
const oppMp = async (page, i) => (await getGameState(page)).players.player_2.activeSlots[i].mp;
const box = async (locator) => locator.boundingBox();
const stripKind = (page) => page.locator('#status-strip').getAttribute('data-status-kind');

test('U2: tap Alyssa -> tray -> Attack -> glowing targets -> preview -> Confirm drops the MP by her Power', async ({ page }) => {
	test.setTimeout(90000);
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await boot(page);
	const gs0 = await getGameState(page);
	const power = 20;
	const before = await oppMp(page, 1);

	// 1. Tap an own card: it is selected (ring) and the tray opens above it with Attack / Quest / Details.
	await tapOwnCard(page, 'mosje', 0);
	const tile = ownTile(page, 'mosje', 0);
	await expect(tile).toHaveClass(/is-selected/);
	const tray = page.locator('[data-action-tray]');
	await expect(tray.locator('[data-action]')).toHaveText(['Attack', 'Quest', 'Details']);
	for (const action of ['attack', 'quest', 'details']) {
		const chip = tray.locator(`[data-action="${action}"]`);
		const b = await box(chip);
		expect(b.height, `${action} chip tall enough to tap`).toBeGreaterThanOrEqual(44);
		expect(b.width, `${action} chip wide enough to tap`).toBeGreaterThanOrEqual(88);
		expect(await chip.getAttribute('disabled'), 'never the disabled attribute').toBeNull();
		await expect(chip).toHaveAttribute('aria-disabled', 'false');
	}
	// The tray sits above the tile, inside the screen, and never reaches the hand.
	const trayBox = await box(tray);
	const tileBox = await box(tile);
	const handTop = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.hand-card-wrap')].map((el) => el.getBoundingClientRect().top)));
	expect(trayBox.y + trayBox.height, 'tray above the selected tile').toBeLessThanOrEqual(tileBox.y + 1);
	expect(trayBox.y, 'tray not clipped at the top').toBeGreaterThanOrEqual(0);
	expect(trayBox.x, 'tray not clipped at the left').toBeGreaterThanOrEqual(0);
	expect(trayBox.x + trayBox.width, 'tray not clipped at the right').toBeLessThanOrEqual(1920);
	expect(trayBox.y + trayBox.height, 'tray never overlaps the hand').toBeLessThanOrEqual(handTop);
	await page.mouse.move(2, 2); // off the tile: no hover dock over the board in the screenshot
	await page.waitForTimeout(300);
	await page.screenshot({ path: `${SHOT_DIR}/u2-tray.png` });

	// 2. Attack: the tray hands over to the status strip; Fresh Ming is invalid (badge + reason toast), Ronald glows.
	await chooseTray(page, 'attack');
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'choose-target');
	await expect(statusStrip(page)).toContainText('Choose a target for Alyssa (Power 20)');
	await expect(tray).toHaveCount(0);
	await expect(page.locator('[data-board]')).toHaveAttribute('data-mode', 'choose-target');
	const fresh = targetTile(page, 'player_2:0');
	const open = targetTile(page, 'player_2:1');
	await expect(fresh).toHaveAttribute('data-target', 'invalid');
	await expect(fresh.locator('[data-target-badge]')).toHaveText('Fresh');
	await expect(fresh).toHaveAttribute('data-reason', "Fresh Mosjes can't be attacked");
	await expect(open).toHaveAttribute('data-target', 'valid');
	await fresh.click();
	await expect(page.locator('#board-toast')).toHaveText("Fresh Mosjes can't be attacked");
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'choose-target');

	// 3. Tap the valid target: the one-line preview with the exact numbers, Confirm + Cancel in the strip, a -20 chip on the tile.
	await open.click();
	const expected = buildAttackPreview(gs0, 'player_1', 0, 'player_2', 1);
	expect(expected).toBe(`Alyssa hits Ronald: −${power} MP (leaves ${before - power})`);
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'preview');
	await expect(statusStrip(page).locator('.status-strip__text')).toHaveText(expected);
	await expect(statusStrip(page).locator('[data-confirm]')).toBeVisible();
	await expect(statusStrip(page).locator('[data-cancel]')).toBeVisible();
	await expect(open).toHaveAttribute('data-preview', '');
	await expect(open.locator('[data-target-chip]')).toHaveText(`−${power}`);
	expect(await oppMp(page, 1), 'nothing happens before Confirm').toBe(before);
	await page.mouse.move(2, 2);
	await page.screenshot({ path: `${SHOT_DIR}/u2-preview.png` });

	// 4. Confirm: the engine path runs, the MP drops by Power in state and on the tile, the strip and glow clear.
	await statusStrip(page).locator('[data-confirm]').click();
	await expect.poll(() => oppMp(page, 1)).toBe(before - power);
	await expect(statusStrip(page)).not.toHaveAttribute('data-status-kind', /./);
	await expect(page.locator('[data-board]')).not.toHaveAttribute('data-mode', /./);
	await expect(page.locator('[data-target]')).toHaveCount(0);
	expect((await readOpponentMosjes(page))[1].mp).toBe(before - power);
	expect((await getGameState(page)).players.player_1.activeSlots[0].actedThisTurn).toBe(true);

	// 5. The Mosje has acted: its Attack and Quest chips are dimmed (aria-disabled), a tap shows why.
	await tapOwnCard(page, 'mosje', 0);
	const attackChip = tray.locator('[data-action="attack"]');
	await expect(attackChip).toHaveAttribute('aria-disabled', 'true');
	await expect(tray.locator('[data-action="quest"]')).toHaveAttribute('aria-disabled', 'true');
	await expect(attackChip).toHaveAttribute('data-reason', /already acted/);
	await chooseTray(page, 'attack', { force: true }); // Playwright counts aria-disabled as not enabled; a player can tap it
	await expect(page.locator('#board-toast')).toContainText('already acted');
	await expect(tray, 'a dimmed chip does not close the tray').toHaveCount(1);
	await expect(statusStrip(page)).not.toHaveAttribute('data-status-kind', /./);
});

test('U2: tapping the target a second time confirms; tapping another valid target switches the preview', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	const ming = await oppMp(page, 0);
	const ronald = await oppMp(page, 1);

	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await targetTile(page, 'player_2:0').click();
	await expect(statusStrip(page).locator('.status-strip__text')).toHaveText(`Alyssa hits Ming: −20 MP (leaves ${ming - 20})`);
	await targetTile(page, 'player_2:1').click();
	await expect(statusStrip(page).locator('.status-strip__text')).toHaveText(`Alyssa hits Ronald: −20 MP (leaves ${ronald - 20})`);
	await expect(targetTile(page, 'player_2:0')).not.toHaveAttribute('data-preview', /.*/);
	await expect(targetTile(page, 'player_2:1')).toHaveAttribute('data-preview', '');
	expect(await oppMp(page, 0)).toBe(ming);
	expect(await oppMp(page, 1)).toBe(ronald);

	await targetTile(page, 'player_2:1').click(); // the same target again = Confirm
	await expect.poll(() => oppMp(page, 1)).toBe(ronald - 20);
	expect(await oppMp(page, 0), 'the other target is untouched').toBe(ming);
	await expect(statusStrip(page)).not.toHaveAttribute('data-status-kind', /./);
});

test('U2: Esc, Cancel and a tap on empty felt each return to idle with nothing changed', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	const idle = async () => {
		await expect(page.locator('[data-action-tray]')).toHaveCount(0);
		await expect(statusStrip(page)).not.toHaveAttribute('data-status-kind', /./);
		await expect(page.locator('.is-selected')).toHaveCount(0);
		await expect(page.locator('[data-target]')).toHaveCount(0);
	};
	const felt = page.locator('.board-middle');

	// Esc closes the tray; a second tap on the selected card closes it too.
	await tapOwnCard(page, 'mosje', 0);
	await page.keyboard.press('Escape');
	await idle();
	await tapOwnCard(page, 'mosje', 0);
	await ownTile(page, 'mosje', 0).click();
	await idle();

	// Empty felt closes the tray.
	await tapOwnCard(page, 'mosje', 0);
	await felt.click({ position: { x: 20, y: 20 } });
	await idle();

	// While choosing a target: Esc, Cancel and empty felt all cancel the whole attack.
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await page.keyboard.press('Escape');
	await idle();
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await statusStrip(page).locator('[data-cancel]').click();
	await idle();
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await felt.click({ position: { x: 20, y: 20 } });
	await idle();

	// ... and from the preview too.
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await targetTile(page, 'player_2:1').click();
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'preview');
	await statusStrip(page).locator('[data-cancel]').click();
	await idle();

	const gs = await getGameState(page);
	expect(gs.players.player_2.activeSlots[1].mp, 'no attack happened').toBe(40);
	expect(gs.players.player_1.activeSlots[0].actedThisTurn, 'the Mosje has not acted').toBeFalsy();
});

test('U2: opponent cards and off-turn taps open the detail view, not a tray', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	await targetTile(page, 'player_2:1').click();
	await expect(page.locator('[data-action-tray]')).toHaveCount(0);
	await expect(page.locator('#modal-root.modal-root--open')).toBeVisible();
	await page.keyboard.press('Escape');
	await page.locator('.modal-backdrop').click({ position: { x: 5, y: 5 } });
	await expect(page.locator('#modal-root.modal-root--open')).toHaveCount(0);
	expect(await stripKind(page)).toBeNull();
});

test('U2: Quest by tap - Quest chip, the 3 Quest tiles glow or dim with a reason, a glowing tile rolls the Quest', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	await setQuestFaceUp(page, 'DIGITAL', 'quest_debug_system'); // Technical 2+: Alyssa has none -> Locked
	await setQuestFaceUp(page, 'ARTISTIC', 'quest_parkeren_delft'); // discard a ready Piecie: none -> Can't pay
	await setNextDice(page, [6, 6, 6]);
	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;

	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'quest');
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'choose-quest');
	await expect(statusStrip(page)).toContainText('Choose a Quest for Alyssa');
	await expect(page.locator('[data-action-tray]')).toHaveCount(0);
	const stack = (id) => page.locator(`.quest-stack[data-quest-stack="${id}"]`);
	await expect(stack('FIGHTING')).toHaveAttribute('data-target', 'valid');
	await expect(stack('DIGITAL')).toHaveAttribute('data-target', 'invalid');
	await expect(stack('DIGITAL').locator('[data-target-badge]')).toHaveText('Locked');
	await expect(stack('ARTISTIC')).toHaveAttribute('data-target', 'invalid');
	await expect(stack('ARTISTIC').locator('[data-target-badge]')).toHaveText("Can't pay");
	await page.screenshot({ path: `${SHOT_DIR}/u2-quest.png` });

	// A dimmed tile shows its reason and keeps the mode; the glowing one starts the Quest.
	await stack('DIGITAL').click();
	await expect(page.locator('#board-toast')).toContainText('Condition not met');
	await stack('ARTISTIC').click();
	await expect(page.locator('#board-toast')).toContainText('Cannot pay: Discard 1 ready Piecie');
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'choose-quest');
	expect((await getGameState(page)).players.player_1.activeSlots[0].actedThisTurn).toBeFalsy();

	await stack('FIGHTING').click();
	const result = page.locator('.modal-mosje-select-btn:not([disabled])').first();
	await result.waitFor({ state: 'visible', timeout: 5000 });
	await expect(page.locator('.modal-card')).toContainText('Quest succeeded');
	await result.click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.activeSlots[0].mp, { timeout: 8000 }).toBe(before + 25);
	await expect(statusStrip(page)).not.toHaveAttribute('data-status-kind', /./);
	expect((await readOwnedMosjes(page))[0].mp).toBe(before + 25);
});

test('U2: questByTap helper wins a Quest with forced dice and the Mosje has then acted', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	await setNextDice(page, [6, 6, 6]);
	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	await questByTap(page, { slot: 0, stackId: 'FIGHTING' });
	const gs = await getGameState(page);
	expect(gs.players.player_1.activeSlots[0].mp).toBe(before + 25);
	expect(gs.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
	expect(gs.questStacks.FIGHTING.faceUp, 'a new Quest turned face-up').not.toBe('quest_tough_it_out');
	await tapOwnCard(page, 'mosje', 0);
	await expect(page.locator('[data-action-tray] [data-action="quest"]')).toHaveAttribute('aria-disabled', 'true');
});

test('U2: attackByTap helper attacks with a second tap', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	const ming = await oppMp(page, 0);
	await attackByTap(page, { slot: 0, target: 'player_2:0', confirmBy: 'retap' });
	expect(await oppMp(page, 0)).toBe(ming - 20);
});

test('U2: Ability chip names its Energy cost, a short pool says why, and with Energy the tap runs the ability', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	await setMosjeOnField(page, 'player_1', 0, 'mosje_tuk_healer', { mp: 30, level: 1 }); // Healing Presence: 1 Energy, heals an own Mosje
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_bulldozer', { mp: 40, level: 1 });
	const crystals = page.locator('#energy-player .energy-crystals');

	await setEnergy(page, 'player_1', 0);
	await tapOwnCard(page, 'mosje', 'mosje_tuk_healer');
	const chip = page.locator('[data-action-tray] [data-action="ability"]');
	await expect(chip).toHaveText('Ability · 1 Energy');
	await expect(chip).toHaveAttribute('aria-disabled', 'true');
	await chooseTray(page, 'ability', { force: true });
	await expect(page.locator('#board-toast')).toHaveText('Not enough Energy (need 1)');
	await expect(page.locator('[data-action-tray]'), 'a dimmed chip keeps the tray open').toHaveCount(1);
	await page.keyboard.press('Escape');

	await setEnergy(page, 'player_1', 3);
	await tapOwnCard(page, 'mosje', 'mosje_tuk_healer');
	await expect(chip).toHaveAttribute('aria-disabled', 'false');
	await chip.hover(); // the spend preview shows on the crystals while the chip is hovered
	await expect(crystals).toHaveAttribute('data-preview', 'spend');
	await expect(crystals.locator('.energy-count')).toHaveText('3/6 → 2/6');
	await page.keyboard.press('Escape');
	await abilityByTap(page, 'mosje_tuk_healer');
	const pick = page.locator('.modal-mosje-select-btn:not([disabled])').first();
	await pick.waitFor({ state: 'visible', timeout: 5000 });
	await pick.click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.energy, { timeout: 8000 }).toBe(2);
	expect((await getGameState(page)).players.player_1.activeSlots[0].abilityUsedThisTurn).toBeTruthy();
	await tapOwnCard(page, 'mosje', 'mosje_tuk_healer');
	await expect(chip).toHaveAttribute('data-reason', 'Ability already used this turn');
});

test('U2: Piecie tray shows Activate with its Energy cost and a tap runs the Piecie', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	await page.evaluate(() => {
		window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_ronald_kip', { faceDown: true });
		window.__testHooks.setPiecieOnField('player_1', 1, 'piecie_kannetje_melk', { faceDown: true });
	});
	await unlockPiecies(page, 'player_1');
	await setEnergy(page, 'player_1', 1);

	await tapOwnCard(page, 'piecie', 'piecie_ronald_kip');
	await expect(page.locator('[data-action-tray] [data-action]')).toHaveText(['Activate · 2 Energy', 'Details']);
	const costly = page.locator('[data-action-tray] [data-action="activate"]');
	await expect(costly).toHaveAttribute('aria-disabled', 'true');
	await expect(costly).toHaveAttribute('data-reason', 'Not enough Energy (need 2)');
	await page.mouse.move(2, 2);
	await page.waitForTimeout(300);
	await page.screenshot({ path: `${SHOT_DIR}/u2-piecie-tray.png` });
	await page.keyboard.press('Escape');

	await activateByTap(page, 'piecie_kannetje_melk'); // free: a plain "Activate" chip, no Energy spent
	await expect.poll(async () => {
		const slot = (await getGameState(page)).players.player_1.piecieSlots[1];
		return !slot || slot.activated === true;
	}, { timeout: 8000 }).toBe(true);
	expect((await getGameState(page)).players.player_1.energy).toBe(1);
});

test('U2: the Place you played selects with a Details-only tray below it, and Details opens its view', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { bothOpen: true });
	await setHand(page, 'player_1', ['place_drain_zone']);
	await setEnergy(page, 'player_1', 6);
	await playCardFromHand(page, 'place_drain_zone');
	await expect.poll(async () => (await getGameState(page)).activePlace).toBe('place_drain_zone');
	await page.mouse.move(2, 2);

	await tapOwnCard(page, 'place');
	await expect(page.locator('[data-action-tray] [data-action]')).toHaveText(['Details']);
	await expect(page.locator('#board-place [data-zone="place"]')).toHaveClass(/is-selected/);
	// The Place sits right under the opponent's row: its tray opens BELOW it so it never covers an opponent tile.
	const trayBox = await page.locator('[data-action-tray]').boundingBox();
	const placeBox = await page.locator('#board-place [data-zone="place"]').boundingBox();
	expect(trayBox.y, 'Place tray below the tile').toBeGreaterThanOrEqual(placeBox.y + placeBox.height - 1);
	for (const tile of await page.locator('#zone-opponent .card').all()) {
		const t = await tile.boundingBox();
		const overlaps = trayBox.x < t.x + t.width && trayBox.x + trayBox.width > t.x && trayBox.y < t.y + t.height && trayBox.y + trayBox.height > t.y;
		expect(overlaps, 'the Place tray covers no opponent tile').toBe(false);
	}
	await page.mouse.move(2, 2);
	await page.waitForTimeout(300);
	await page.screenshot({ path: `${SHOT_DIR}/u2-place-tray.png` });
	await chooseTray(page, 'details');
	await expect(page.locator('#modal-root.modal-root--open')).toBeVisible();
	await expect(page.locator('[data-action-tray]')).toHaveCount(0);
});
