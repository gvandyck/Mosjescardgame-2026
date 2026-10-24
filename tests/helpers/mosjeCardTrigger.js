// mosjeCardTrigger — fire a Mosje ability the way the Card List says, through the real UI where one exists.
import { questViaUi, playCardFromHand, attackViaUi, getGameState } from '../ui/helpers.js';
import { abilityByTap, activateByTap, beginQuestByTap, cancelSelection, chooseTray, tapOwnCard } from './boardTaps.js';
import { answerModals } from './answerModals.js';
import { QUESTS } from '../../src/data/quests.js';

// Quest "no attempt" on the tap flow: the Mosje's Quest chip is aria-disabled (= the old "No Quest available"), or after
// choosing Quest the stack's tile is data-target="invalid" (= the old disabled option); then back out with Esc.
async function questRefused(page, t) {
	await tapOwnCard(page, 'mosje', t.slot ?? 0);
	const chip = page.locator('[data-action-tray] [data-action="quest"]');
	if ((await chip.getAttribute('aria-disabled')) === 'true') { await cancelSelection(page); return; }
	await chooseTray(page, 'quest');
	await page.locator('#status-strip[data-status-kind="choose-quest"]').waitFor({ timeout: 5000 });
	const tile = page.locator(`.quest-stack[data-quest-stack="${t.stack}"]`);
	if ((await tile.getAttribute('data-target')) !== 'invalid') throw new Error(`the ${t.stack} Quest should be refused but its tile is choosable`);
	await cancelSelection(page);
	await page.waitForTimeout(150);
}

const boundary = (page, kind, playerId) =>
	page.evaluate(({ k, p }) => window.__testHooks.runTurnBoundary(k, p), { k: kind, p: playerId });

export async function mosjeCardTrigger(page, entry, c) {
	const t = c.trigger;
	let picks = t.picks || [];
	switch (t.kind) {
		case 'button':
			await abilityByTap(page, t.mosje || entry.mosje); // the Ability chip in the Mosje's action tray
			break;
		case 'playFromHand': await playCardFromHand(page, t.cardId); await page.waitForTimeout(400); break;
		case 'none': break; // Power-only cases: the board is read as laid out
		case 'turnStart': await boundary(page, 'start', t.player || 'player_1'); break;
		case 'turnEnd': await boundary(page, 'end', t.player || 'player_1'); break;
		case 'activatePiecie': await activateByTap(page, t.cardId, { force: true }); break; // a refusal case taps the dimmed chip: nothing is paid
		case 'quest':
			// t.ids = data-ids taken in order after the slot / stack picks (e.g. 'ok' for the result screen, 'no', '0'); else the first enabled option.
			if (!picks.length) { await questViaUi(page, { slot: t.slot ?? 0, stackId: t.stack, picks: t.ids || [] }); return; }
			// Named picks (a reaction option such as DJ's Lucky Beats): tap the Mosje, Quest and the stack's tile, then answer by label.
			// The old Quest picker listed "FIGHTING - <Quest name>" and a registry pick may name that Quest (/Arm Wrestling/): the
			// tap on the Quest tile replaces that modal, so such a leading pick is spent. (Left in, it would never match, never be
			// shifted, and block every pick after it.)
			{
				const faceUp = (await getGameState(page)).questStacks?.[t.stack]?.faceUp;
				const questName = QUESTS.find(q => q.id === faceUp)?.name;
				if (picks[0] instanceof RegExp && questName && picks[0].test(questName)) picks = picks.slice(1);
			}
			await beginQuestByTap(page, t.slot ?? 0);
			await page.locator(`.quest-stack[data-quest-stack="${t.stack}"]`).click();
			// the Quest flow is async: let its first modal open before answerModals looks for it
			await page.locator('.modal-mosje-select-btn:not([disabled]), .target-option:not([disabled]), #modal-continue').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
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
