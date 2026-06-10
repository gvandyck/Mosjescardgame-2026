/**
 * mosje-abilities.spec.js — Data-driven Mosje ability tests.
 *
 * Each entry runs a single-Mosje deck so the named Mosje is the starter, then the
 * runner's 'ability' flow clicks its ability button and asserts the outcome.
 *
 * Run: npx playwright test --project=cards tests/ui/cards/mosje-abilities.spec.js
 */

import { test } from '@playwright/test';
import { ABILITY_SPECS } from './card-registry.js';
import { runCardTest } from './card-test-runner.js';

for (const spec of ABILITY_SPECS) {
	const title = spec.skipReason
		? `ability: ${spec.mosje} — ${spec.expectedEffect} [SKIP: ${spec.skipReason}]`
		: `ability: ${spec.mosje} — ${spec.expectedEffect}`;
	test(title, async ({ page }) => {
		test.setTimeout(90000);
		await runCardTest(page, spec, test);
	});
}
