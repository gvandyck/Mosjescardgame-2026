/**
 * piecie-effects.spec.js — Data-driven piecie effect tests.
 *
 * Loops every PIECIE entry in card-registry.js and runs the generic
 * card-test-runner against the live browser game. Adding a piecie to the
 * registry automatically creates a test here.
 *
 * Run: npx playwright test --project=sim tests/ui/cards/piecie-effects.spec.js
 */

import { test } from '@playwright/test';
import { PIECIE_SPECS } from './card-registry.js';
import { runCardTest } from './card-test-runner.js';

for (const spec of PIECIE_SPECS) {
	const title = spec.skipReason
		? `piecie: ${spec.cardId} — ${spec.expectedEffect} [SKIP: ${spec.skipReason}]`
		: `piecie: ${spec.cardId} — ${spec.expectedEffect}`;
	test(title, async ({ page }) => {
		test.setTimeout(90000);
		await runCardTest(page, spec, test);
	});
}
