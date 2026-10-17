/**
 * quest-cards-2-0.spec.js - card-test-library for the 38 Obby 2.0 Quests (Phase 60-08, TEST-02).
 * Real game, headless, testMode hooks. Run headless only via a temporary config:
 *   npx playwright test -c <temporary headless config> tests/ui/cards/quest-cards-2-0.spec.js --workers=1
 */
import { test } from '@playwright/test';
import { QUEST_REGISTRY } from './quest-registry-2-0.js';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

for (const entry of QUEST_REGISTRY) {
	for (const c of entry.cases) {
		test(`quest: ${entry.quest} (${entry.deck}) - ${c.name}`, async ({ page }) => {
			test.setTimeout(60000);
			await runMosjeCardTest(page, { ...entry, mosje: entry.quest }, c);
		});
	}
}
