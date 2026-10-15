/**
 * mosje-cards-2-0.spec.js - card-test-library for the 18 Example-Deck Mosjes (Phase 58, EFX-01).
 * Replaces mosje-abilities.spec.js (the V4 per-ability runner). Real game, headless, testMode hooks.
 * Run headless only: npx playwright test -c <temporary headless config> tests/ui/cards/mosje-cards-2-0.spec.js
 */
import { test } from '@playwright/test';
import { MOSJE_REGISTRY } from './mosje-registry-2-0.js';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

for (const entry of MOSJE_REGISTRY) {
	for (const c of entry.cases) {
		test(`mosje: ${entry.mosje} (deck ${entry.deck ?? "none"}) - ${c.name}`, async ({ page }) => {
			test.setTimeout(60000);
			await runMosjeCardTest(page, entry, c);
		});
	}
}
