// Every card's ability text ends inside its text plate (auto-fit text size), at the pop-up size and at the
// small 230px hand stress size. Renders each card definition with the real card renderer and real CSS.
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from '../helpers.js';

for (const width of [440, 230]) {
	test(`ability text fits the plate for every card at ${width}px wide`, async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await seedOfflineSession(page, 'EXAMPLE_TAKSEN', 'EXAMPLE_CREATIEVELINGEN');
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);
		const result = await page.evaluate(async (w) => {
			const { renderCard } = await import('/src/ui/cardRenderer.js');
			const { MOSJES } = await import('/src/data/mosjes.js');
			const { PIECIES } = await import('/src/data/piecies.js');
			const { SNELLE_PIECIES } = await import('/src/data/snellePiecies.js');
			const { PLACES } = await import('/src/data/places.js');
			const cards = [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES].filter((c) => !c.disabled);
			const holder = document.createElement('div');
			holder.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#000';
			document.body.appendChild(holder);
			const bad = [];
			let boxed = 0;
			for (const c of cards) {
				const card = renderCard({ ...c, description: c.abilityDescription || c.description || '' }, { compact: false });
				card.style.setProperty('--cv1-w', `${w}px`);
				holder.replaceChildren(card);
				const plate = card.querySelector('.ct-plate');
				if (!plate) continue;
				boxed++;
				const over = card.querySelector('.cv1-desc').getBoundingClientRect().bottom - plate.getBoundingClientRect().bottom;
				if (over > 1) bad.push(`${c.id} (+${Math.round(over)}px)`);
			}
			holder.remove();
			return { boxed, bad };
		}, width);
		expect(result.boxed).toBeGreaterThan(100);
		expect(result.bad, 'cards whose text runs out of the plate').toEqual([]);
	});
}
