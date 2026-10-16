/**
 * place-cards-2-0.spec.js - card-test-library for the Power Places (Phase 60-04, EFX-04).
 * Real game, headless, testMode hooks. Run headless only via a temporary config:
 *   npx playwright test -c <temporary headless config> tests/ui/cards/place-cards-2-0.spec.js
 */
import { test } from '@playwright/test';
import { PLACE_REGISTRY } from './place-registry-2-0.js';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

for (const entry of PLACE_REGISTRY) {
	for (const c of entry.cases) {
		test(`place: ${entry.place} (${entry.deck}) - ${c.name}`, async ({ page }) => {
			test.setTimeout(60000);
			await runMosjeCardTest(page, { ...entry, mosje: entry.place }, c);
		});
	}
}
