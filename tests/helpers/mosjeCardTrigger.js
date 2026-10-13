// mosjeCardTrigger — fire a Mosje ability the way the Card List says, through the real UI where one exists.
import { questViaUi } from '../ui/helpers.js';
import { answerModals } from './answerModals.js';

async function activateFieldPiecie(page, cardId) {
	const el = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await el.waitFor({ state: 'visible', timeout: 8000 });
	const btn = el.locator('button:has-text("Activate")');
	await btn.waitFor({ state: 'visible', timeout: 8000 });
	await btn.click();
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
		case 'turnStart': await boundary(page, 'start', t.player || 'player_1'); break;
		case 'turnEnd': await boundary(page, 'end', t.player || 'player_1'); break;
		case 'activatePiecie': await activateFieldPiecie(page, t.cardId); break;
		case 'quest':
			if (!picks.length) { await questViaUi(page, { slot: t.slot ?? 0, stackId: t.stack }); return; }
			// Named picks (a reaction option such as DJ's Lucky Beats): click #btn-quest, then answer by label.
			await page.click('#btn-quest');
			break;
		case 'attacked': await page.evaluate(() => window.__testHooks.botAttack(0, 0)); await page.waitForTimeout(400); break;
		case 'botPlayPiecie': await page.evaluate((id) => window.__testHooks.botPlayPiecie(id), t.cardId); break;
		default: throw new Error(`Unknown trigger kind: ${t.kind}`);
	}
	await answerModals(page, picks);
	await page.waitForTimeout(250);
	if (t.then) await mosjeCardTrigger(page, entry, { ...c, trigger: t.then });
}
