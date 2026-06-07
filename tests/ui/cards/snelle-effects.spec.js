/**
 * snelle-effects.spec.js — Data-driven Snelle Piecie effect tests.
 *
 * Snelle Piecies are played directly from hand (playThen:'play-direct'). Reactive
 * snelles (COUNTER/DODGE/PROTECT) that only fire in response to an opponent action
 * are marked skipReason in the registry and tracked, not auto-run.
 *
 * Run: npx playwright test --project=sim tests/ui/cards/snelle-effects.spec.js
 */

import { test } from '@playwright/test';
import { SNELLE_SPECS } from './card-registry.js';
import { runCardTest } from './card-test-runner.js';

for (const spec of SNELLE_SPECS) {
	const title = spec.skipReason
		? `snelle: ${spec.cardId} — ${spec.expectedEffect} [SKIP: ${spec.skipReason}]`
		: `snelle: ${spec.cardId} — ${spec.expectedEffect}`;
	test(title, async ({ page }) => {
		test.setTimeout(90000);
		await runCardTest(page, spec, test);
	});
}
