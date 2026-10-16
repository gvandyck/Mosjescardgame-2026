/**
 * piecie-cards-2-0.spec.js - card-test-library for the Example-Deck Piecies (Phase 59, EFX-02).
 * Real game, headless, testMode hooks. Run headless only via a temporary config:
 *   npx playwright test -c <temporary headless config> tests/ui/cards/piecie-cards-2-0.spec.js
 */
import { test } from '@playwright/test';
import { PIECIE_REGISTRY } from './piecie-registry-2-0.js';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

for (const entry of PIECIE_REGISTRY) {
	for (const c of entry.cases) {
		test(`piecie: ${entry.piecie} (${entry.section}) - ${c.name}`, async ({ page }) => {
			test.setTimeout(60000);
			await runMosjeCardTest(page, { ...entry, mosje: entry.piecie }, c);
		});
	}
}
