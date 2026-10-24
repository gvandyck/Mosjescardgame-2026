// boardTaps.js — Playwright helpers for the tap-first 2.0 board (Phase 63-05): select an own card, pick a tray chip, attack by
// tapping a target and Confirm, Quest by tapping a Quest tile, Ability / Activate from the tray. Everything is a real tap on the
// live board, never a hook. Used by the attack-action spec and the rewritten attackViaUi / questViaUi style flows.
import { clickModalOption } from '../ui/helpers.js';

const ZONES = { mosje: '#zone-player', piecie: '#piecies-player', place: '#board-place' };

/** The own tile of a kind ('mosje' | 'piecie' | 'place') by slot index (number) or cardId (string). */
export function ownTile(page, kind, slotOrId = 0) {
	const by = kind === 'place' ? '' : typeof slotOrId === 'number' ? `[data-slot-index="${slotOrId}"]` : `[data-card-id="${slotOrId}"]`;
	return page.locator(`${ZONES[kind]} [data-zone="${kind}"]${by}`).first();
}

/** The opponent's Mosje tile for a target id "player_2:0". */
export function targetTile(page, target = 'player_2:0') {
	const [playerId, slot] = target.split(':');
	return page.locator(`[data-zone="mosje"][data-player-id="${playerId}"][data-slot-index="${slot}"]`).first();
}

/** A random opening can make the starter's Draw step (Coert and friends) open a blocking option modal on the first turn:
 *  answer it with "Draw normally" so the tap lands on the board. A no-op when no such modal is open. */
async function dismissDrawStep(page) {
	const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	if (await draw.count()) await draw.first().click().catch(() => {});
}

/** Tap an own card and wait for its action tray. The tap lands low on the left of the tile, clear of the state pills (Fresh,
 *  Protected, SKIPS TURN): a sideways tile centres its pill, and a tap on a pill shows its reason instead of opening the tray. */
export async function tapOwnCard(page, kind, slotOrId = 0) {
	await dismissDrawStep(page);
	const tile = ownTile(page, kind, slotOrId);
	await tile.waitFor({ state: 'visible', timeout: 8000 });
	const box = await tile.boundingBox();
	await tile.click(box ? { position: { x: Math.round(box.width * 0.2), y: Math.round(box.height * 0.6) } } : {});
	await page.locator('[data-action-tray]').waitFor({ state: 'visible', timeout: 5000 });
}

/** Tap an own card, read one tray chip ({ present, disabled, label, reason }), then close the tray with Esc. */
export async function readTrayChip(page, kind, slotOrId, action) {
	await tapOwnCard(page, kind, slotOrId);
	const chip = page.locator(`[data-action-tray] [data-action="${action}"]`);
	const out = (await chip.count()) === 0 ? { present: false } : {
		present: true,
		disabled: (await chip.getAttribute('aria-disabled')) === 'true',
		label: (await chip.innerText()).trim(),
		reason: (await chip.getAttribute('data-reason')) || '',
	};
	await cancelSelection(page);
	return out;
}

/** Tap one chip of the open tray (data-action: attack | quest | ability | activate | details). A dimmed chip (aria-disabled) stays
 *  tappable for the player, but Playwright treats aria-disabled as not enabled: pass { force: true } to tap it for its reason toast. */
export async function chooseTray(page, action, { force = false } = {}) {
	await page.locator(`[data-action-tray] [data-action="${action}"]`).click({ force });
}

/** The status strip of the page and its message kind. */
export const statusStrip = (page) => page.locator('#status-strip');

/** Open the detail view of an own card the way a player does on the 2.0 board: tap it, then Details in the tray. */
export async function openOwnDetails(page, kind, slotOrId = 0) {
	await tapOwnCard(page, kind, slotOrId);
	await chooseTray(page, 'details');
}

/** Attack by taps: select the Mosje, Attack, tap the target, then Confirm (or tap the target again with confirmBy 'retap'). */
export async function attackByTap(page, { slot = 0, target = 'player_2:0', confirmBy = 'button' } = {}) {
	await tapOwnCard(page, 'mosje', slot);
	await chooseTray(page, 'attack');
	await statusStrip(page).locator('[data-cancel]').waitFor({ state: 'visible', timeout: 5000 });
	await targetTile(page, target).click();
	await page.locator('#status-strip[data-status-kind="preview"]').waitFor({ timeout: 5000 });
	if (confirmBy === 'retap') await targetTile(page, target).click();
	else await page.locator('#status-strip [data-confirm]').click();
	await page.waitForTimeout(500);
}

/** Click through the option modals a Quest opens (cost, dice, result): the `picks` data-ids in order, else the first enabled option.
 *  The first modal gets up to 5 s to open after the Quest tile tap (the flow is async); later gaps get 800 ms. (locator.isVisible
 *  ignores its timeout, so the waits use waitFor.) */
export async function clickThroughOptions(page, picks = [], max = 8) {
	const queue = [...picks];
	for (let i = 0; i < max; i++) {
		const btn = page.locator('.modal-mosje-select-btn:not([disabled])').first();
		if (!(await btn.waitFor({ state: 'visible', timeout: i === 0 ? 5000 : 800 }).then(() => true, () => false))) break;
		const want = queue.shift();
		if (want != null) await clickModalOption(page, want); else await btn.click();
		await page.waitForTimeout(150);
	}
	await page.waitForTimeout(300);
}

/** Tap an own Mosje, choose Quest in its tray and wait until the three Quest tiles are choosable (no tile is tapped yet). */
export async function beginQuestByTap(page, slot = 0) {
	await tapOwnCard(page, 'mosje', slot);
	await chooseTray(page, 'quest');
	await page.locator('#status-strip[data-status-kind="choose-quest"]').waitFor({ timeout: 5000 });
}

/** Quest by taps: select the Mosje, Quest, tap the Quest tile of the stack, then click through the option modals (cost, dice, result) like questViaUi. */
export async function questByTap(page, { slot = 0, stackId = 'FIGHTING', picks = [] } = {}) {
	await beginQuestByTap(page, slot);
	await page.locator(`.quest-stack[data-quest-stack="${stackId}"]`).click();
	await clickThroughOptions(page, picks, 8);
}

/** Generic Quest attempt for loops and bots: tap the first own Mosje whose Quest chip is enabled, tap the first valid Quest
 *  tile, then take the first enabled option in every modal. Returns false (nothing tapped) when no Mosje can Quest. */
export async function questFirstByTap(page) {
	const tiles = page.locator('#zone-player [data-zone="mosje"][data-slot-index]');
	const slots = await tiles.evaluateAll((els) => els.map((el) => Number(el.dataset.slotIndex)));
	for (const slot of slots) {
		await tapOwnCard(page, 'mosje', slot);
		const chip = page.locator('[data-action-tray] [data-action="quest"]');
		if (!(await chip.count()) || (await chip.getAttribute('aria-disabled')) === 'true') { // a defeated Mosje has only Details
			await cancelSelection(page);
			continue;
		}
		await chooseTray(page, 'quest');
		await page.locator('#status-strip[data-status-kind="choose-quest"]').waitFor({ timeout: 5000 });
		await page.locator('.quest-stack[data-target="valid"]').first().click();
		await clickThroughOptions(page, [], 10);
		return true;
	}
	return false;
}

/** True when an own Piecie's tray offers an enabled Activate chip (a Piecie placed this turn is dimmed; the tray is closed again). */
export async function isPiecieActivatable(page, slotOrId) {
	const chip = await readTrayChip(page, 'piecie', slotOrId, 'activate');
	return chip.present && !chip.disabled;
}

/** Activate the first Piecie with this cardId whose tray Activate is enabled (two copies in the row, only one ready). */
export async function activateFirstReady(page, cardId) {
	const slots = await page.locator(`#piecies-player [data-zone="piecie"][data-card-id="${cardId}"]`).evaluateAll((els) => els.map((el) => Number(el.dataset.slotIndex)));
	for (const slot of slots) {
		if (await isPiecieActivatable(page, slot)) { await activateByTap(page, slot); return true; }
	}
	return false;
}

/** How many Piecies in the own row can be activated right now (the old "count the Activate buttons"). */
export async function countActivatablePiecies(page) {
	const slots = await page.locator('#piecies-player [data-zone="piecie"][data-slot-index]').evaluateAll((els) => els.map((el) => Number(el.dataset.slotIndex)));
	let n = 0;
	for (const slot of slots) if (await isPiecieActivatable(page, slot)) n += 1;
	return n;
}

/** Use a Mosje's activated ability from its tray (the ability modals, if any, are left to the caller). */
export async function abilityByTap(page, cardId) {
	await tapOwnCard(page, 'mosje', cardId);
	await chooseTray(page, 'ability');
	await page.waitForTimeout(200);
}

/** Activate a Piecie from its tray. { force: true } also taps a dimmed chip (the engine / the toast then refuses it, like a player's tap). */
export async function activateByTap(page, cardId, { force = false } = {}) {
	await tapOwnCard(page, 'piecie', cardId);
	await chooseTray(page, 'activate', { force });
	await page.waitForTimeout(300);
}

/** Leave any selection / target mode with Esc and wait until the tray and the action strip are gone. */
export async function cancelSelection(page) {
	await page.keyboard.press('Escape');
	await page.locator('[data-action-tray]').waitFor({ state: 'detached', timeout: 3000 });
	await page.waitForFunction(() => !document.querySelector('#status-strip [data-cancel]'));
}
