/**
 * personal-quest-cards-2-1.spec.js - card-test-library for the 12 starter Personal Quests (Phase 71-22, D-35 b).
 * Real game, headless at 1920x1080, testMode hooks. Run headless only via a temporary config:
 *   npx playwright test -c <temporary headless config> tests/ui/cards/personal-quest-cards-2-1.spec.js
 */
import { test } from '@playwright/test';
import { PERSONAL_QUEST_REGISTRY } from './personal-quest-registry-2-1.js';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

test.use({ viewport: { width: 1920, height: 1080 } });

for (const entry of PERSONAL_QUEST_REGISTRY) {
	for (const c of entry.cases) {
		test(`personal quest: ${entry.personalQuest} - ${c.name}`, async ({ page }) => {
			test.setTimeout(60000);
			await runMosjeCardTest(page, { ...entry, mosje: entry.personalQuest }, c);
		});
	}
}
