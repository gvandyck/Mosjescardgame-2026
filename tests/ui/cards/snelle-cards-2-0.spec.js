/**
 * snelle-cards-2-0.spec.js - card-test-library for the Obby 2.0 Snelle (Phase 60, EFX-03).
 * Real game, headless, testMode hooks. Run headless only via a temporary config:
 *   npx playwright test -c <temporary headless config> tests/ui/cards/snelle-cards-2-0.spec.js -g "snelle:"
 */
import { test } from '@playwright/test';
import { SNELLE_REGISTRY } from './snelle-registry-2-0.js';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

for (const entry of SNELLE_REGISTRY) {
	for (const c of entry.cases) {
		test(`snelle: ${entry.snelle} - ${c.name}`, async ({ page }) => {
			test.setTimeout(60000);
			await runMosjeCardTest(page, { ...entry, mosje: entry.snelle }, c);
		});
	}
}
