// mosjeCardTrigger — fire a Mosje ability the way the Card List says, through the real UI where one exists.
import { questViaUi, playCardFromHand, attackViaUi, clickModalOption } from '../ui/helpers.js';
import { answerModals } from './answerModals.js';

async function activateFieldPiecie(page, cardId) {
	const el = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await el.waitFor({ state: 'visible', timeout: 8000 });
	const btn = el.locator('button:has-text("Activate")');
	await btn.waitFor({ state: 'visible', timeout: 8000 });
	await btn.click();
}

// Quest "no attempt": open the Quest picker and check the stack's option is disabled (all disabled = "No Quest available"), then back out.
async function questRefused(page, t) {
	await page.click('#btn-quest');
	await clickModalOption(page, String(t.slot ?? 0));
	const option = page.locator(`.modal-mosje-select-btn[data-id="${t.stack}"]`);
	const none = page.locator('.modal-card h3', { hasText: 'No Quest available' });
	await option.or(none).first().waitFor({ state: 'visible', timeout: 5000 });
	if (await option.count()) {
		if (!(await option.isDisabled())) throw new Error(`the ${t.stack} Quest should be refused but its option is enabled`);
		await page.click('#modal-option-cancel');
	} else await page.click('.modal-mosje-select-btn');
	await page.waitForTimeout(150);
}

const boundary = (page, kind, playerId) =>
	page.evaluate(({ k, p }) => window.__testHooks.runTurnBoundary(k, p), { k: kind, p: playerId });

export async function mosjeCardTrigger(page, entry, c) {
	const t = c.trigger;
	const picks = t.picks || [];
	switch (t.kind) {
		case 'button':
			await page.locator(`.mosje-card--owned[data-card-id="${t.mosje || entry.mosje}"] .mosje-ability-btn`).click();
			break;
		case 'playFromHand': await playCardFromHand(page, t.cardId); await page.waitForTimeout(400); break;
		case 'none': break; // Power-only cases: the board is read as laid out
		case 'turnStart': await boundary(page, 'start', t.player || 'player_1'); break;
		case 'turnEnd': await boundary(page, 'end', t.player || 'player_1'); break;
		case 'activatePiecie': await activateFieldPiecie(page, t.cardId); break;
		case 'quest':
			// t.ids = data-ids taken in order after the slot / stack picks (e.g. 'ok' for the result screen, 'no', '0'); else the first enabled option.
			if (!picks.length) { await questViaUi(page, { slot: t.slot ?? 0, stackId: t.stack, picks: t.ids || [] }); return; }
			// Named picks (a reaction option such as DJ's Lucky Beats): click #btn-quest, then answer by label.
			await page.click('#btn-quest');
			break;
		case 'questRefused': await questRefused(page, t); break; // the Quest cannot be attempted: its option is disabled (or no Quest is available)
		case 'attack': await attackViaUi(page, { slot: t.slot ?? 0, target: t.target || 'player_2:0' }); break;
		case 'attacked': await page.evaluate(() => window.__testHooks.botAttack(0, 0)); await page.waitForTimeout(400); break;
		case 'playSnelle': await playCardFromHand(page, t.cardId); await page.waitForTimeout(400); break;
		case 'botPlaySnelle': await page.evaluate((id) => window.__testHooks.botPlaySnelle(id), t.cardId); break;
		case 'botQuest': await page.evaluate(({ s, k }) => window.__testHooks.botQuest(s, k), { s: t.slot ?? 0, k: t.stack }); break;
		case 'botActivatePiecie': await page.evaluate(({ id, tg }) => window.__testHooks.botActivatePiecie(id, tg), { id: t.cardId, tg: t.targets || {} }); break;
		case 'botPlayPiecie': await page.evaluate((id) => window.__testHooks.botPlayPiecie(id), t.cardId); break;
		default: throw new Error(`Unknown trigger kind: ${t.kind}`);
	}
	await answerModals(page, picks);
	await page.waitForTimeout(250);
	if (t.then) await mosjeCardTrigger(page, entry, { ...c, trigger: t.then });
}
