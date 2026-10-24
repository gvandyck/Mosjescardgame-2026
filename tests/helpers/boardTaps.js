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

/** Tap an own card and wait for its action tray. */
export async function tapOwnCard(page, kind, slotOrId = 0) {
	await ownTile(page, kind, slotOrId).click();
	await page.locator('[data-action-tray]').waitFor({ state: 'visible', timeout: 5000 });
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

/** Quest by taps: select the Mosje, Quest, tap the Quest tile of the stack, then click through the option modals (cost, dice, result) like questViaUi. */
export async function questByTap(page, { slot = 0, stackId = 'FIGHTING', picks = [] } = {}) {
	await tapOwnCard(page, 'mosje', slot);
	await chooseTray(page, 'quest');
	await page.locator('#status-strip[data-status-kind="choose-quest"]').waitFor({ timeout: 5000 });
	await page.locator(`.quest-stack[data-quest-stack="${stackId}"]`).click();
	const queue = [...picks];
	for (let i = 0; i < 8; i++) {
		const btn = page.locator('.modal-mosje-select-btn:not([disabled])').first();
		if (!(await btn.isVisible({ timeout: 800 }).catch(() => false))) break;
		const want = queue.shift();
		if (want != null) await clickModalOption(page, want); else await btn.click();
		await page.waitForTimeout(150);
	}
	await page.waitForTimeout(300);
}

/** Use a Mosje's activated ability from its tray (the ability modals, if any, are left to the caller). */
export async function abilityByTap(page, cardId) {
	await tapOwnCard(page, 'mosje', cardId);
	await chooseTray(page, 'ability');
	await page.waitForTimeout(200);
}

/** Activate a Piecie from its tray. */
export async function activateByTap(page, cardId) {
	await tapOwnCard(page, 'piecie', cardId);
	await chooseTray(page, 'activate');
	await page.waitForTimeout(300);
}

/** Leave any selection / target mode with Esc and wait until the tray and the action strip are gone. */
export async function cancelSelection(page) {
	await page.keyboard.press('Escape');
	await page.locator('[data-action-tray]').waitFor({ state: 'detached', timeout: 3000 });
	await page.waitForFunction(() => !document.querySelector('#status-strip [data-cancel]'));
}
