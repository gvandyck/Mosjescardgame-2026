// openModalBuilder.js - Phase 65-08: open one modalManager builder on the live page without a new test hook. It binds a fresh
// modal manager to the game's own #modal-root (the CSS only keys on the markup, so the real prompts look the same) and calls the
// builder by name. The promise a builder returns resolves on a click, so it is never awaited here.
// Args are JSON: the string '$fn' becomes a no-op callback, and an object with a "$card" key becomes that card's definition
// (getCardById) with the other keys of the object laid over it, e.g. { $card: 'mosje_alyssa_fissa', level: 1, mp: 50 }.

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name builder name, e.g. 'showOptionSelect'
 * @param {any[]} [args] arguments of the builder (JSON, see above)
 */
export async function openModalBuilder(page, name, args = []) {
	await page.evaluate(async ({ name, args }) => {
		const { initModalManager } = await import('/src/ui/modalManager.js');
		const { getCardById } = await import('/src/data/cardIndex.js');
		const modal = initModalManager(document.querySelector('#modal-root'));
		const real = args.map((arg) => {
			if (arg === '$fn') return () => {};
			if (arg && typeof arg === 'object' && arg.$card) {
				const { $card, ...rest } = arg;
				return { ...getCardById($card), ...rest };
			}
			return arg;
		});
		modal[name](...real);
	}, { name, args });
}
