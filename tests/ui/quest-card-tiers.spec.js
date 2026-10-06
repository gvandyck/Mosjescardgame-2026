// quest-card-tiers.spec.js — Quest cards use the v1 tier design (was the old renderer).
// Renders real quests through renderCard on the demo page at every tier, hand size and field tile.
import { test, expect } from '@playwright/test';

const DEMO = '/card-tiers-demo.html?tiers=all';
const QUESTS = ['quest_personal_kickboxing_bootcamp'];

async function mountQuest(page, { id, tier, width = 440, fieldMode = false }) {
	await page.evaluate(async ({ id, tier, width, fieldMode }) => {
		const [{ renderCard }, { QUESTS }] = await Promise.all([import('/src/ui/cardRenderer.js'), import('/src/data/quests.js')]);
		const quest = QUESTS.find((q) => q.id === id);
		document.getElementById('fx')?.remove();
		const host = document.createElement('div');
		host.id = 'fx';
		host.style.cssText = 'position:absolute;left:0;top:0;z-index:99;background:#000';
		const el = renderCard({ ...quest, rarity: '★'.repeat(tier) }, { fieldMode });
		el.style.setProperty('--cv1-w', `${width}px`);
		host.append(el);
		document.body.prepend(host);
	}, { id, tier, width, fieldMode });
	return page.locator('#fx > .card');
}

test.describe('Quest cards in the tier design', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1400, height: 1000 });
		await page.goto(DEMO);
		await page.waitForSelector('#tier-grid .card');
	});

	for (const id of QUESTS) {
		for (const tier of [1, 2, 3, 4]) {
			test(`${id} tier ${tier}: v1 face with tier layout, pill, badge and text inside the card`, async ({ page }) => {
				const card = await mountQuest(page, { id, tier });
				await expect(card).toHaveClass(/card-v1/);
				await expect(card).toHaveClass(new RegExp(`card--tier-${tier}`));
				await expect(card).toHaveClass(tier === 4 ? /card--fullart/ : /card--boxed/);
				await expect(card.locator('.cv1-pill')).toHaveText(/QUEST/);
				await expect(card.locator('.cv1-badge-val')).toHaveText(/^\+\d+$/);
				const inside = await card.evaluate((c) => {
					const a = c.getBoundingClientRect(); const d = c.querySelector('.cv1-desc').getBoundingClientRect();
					return d.top >= a.top && d.bottom <= a.bottom && d.left >= a.left && d.right <= a.right;
				});
				expect(inside).toBe(true);
				await page.screenshot({ path: `test-results/quest-card-tier-${tier}.png`, clip: { x: 0, y: 0, width: 460, height: 680 } });
			});
		}
		test(`${id}: field tile renders`, async ({ page }) => {
			const card = await mountQuest(page, { id, tier: 2, fieldMode: true });
			await expect(card).toHaveClass(/card-v1--field/);
			await expect(card.locator('.cv1-pill')).toHaveText('QUEST');
		});
	}
});
