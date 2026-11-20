// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { getAbilityChip } from '../../src/ui/board/getAbilityChip.js';
import { LOSS_STEPS } from '../../src/engine/mp/lossSteps.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';
import * as mosjeAbilities from '../../src/abilities/mosjeAbilities.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

// Phase 72-16 (NUI-04): the 10 Oct leftovers named in 71-VERIFICATION are gone. Each DEAD item had no live caller
// (grep over src/, tests/, scripts/); the KEPT items still have one and stay, with the reason.
const ROOT = join(__dirname, '..', '..');
const SELF = join(__dirname, 'dead-code-2-1.test.ts');

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (/\.(js|ts|mjs)$/.test(p)) out.push(p);
	}
	return out;
}
const FILES = ['src', 'tests', 'scripts'].flatMap((d) => walk(join(ROOT, d))).filter((p) => p !== SELF);

const DEAD = [
	{ file: 'src/engine/mosje/armSetAside.js', names: ['armSetAside'] },
	{ file: 'src/engine/mosje/returnSetAside.js', names: ['returnSetAside'] },
	{ file: 'src/engine/mp/lossSteps/emergencyHealingsStep.js', names: ['emergencyHealingsStep'] },
	{ file: 'src/engine/mosje/fpsWestRevealHand.js', names: ['fpsWestRevealHand'] },
];

const KEPT = [
	{ item: 'LOSS_STEPS.beforeLoss (empty list)', reason: 'applyMpLossToSlot.js still runs the group; kept as an empty hook' },
];

describe('dead code from 71-VERIFICATION is gone', () => {
	for (const d of DEAD) {
		it(`${d.file} does not exist and nothing names it`, () => {
			expect(existsSync(join(ROOT, d.file))).toBe(false);
			for (const p of FILES) {
				const src = readFileSync(p, 'utf8');
				for (const n of d.names) expect(src.includes(n), `${relative(ROOT, p)} still mentions ${n}`).toBe(false);
			}
		});
	}

	it('the kept items are documented', () => {
		expect(KEPT.every((k) => k.reason.length > 10)).toBe(true);
		expect(LOSS_STEPS.beforeLoss).toEqual([]);
	});
});

describe('Michelle, Iron Tuk: Tough Gamble leftovers', () => {
	it('no file names ability_michelle_tough_gamble any more', () => {
		for (const p of FILES) expect(readFileSync(p, 'utf8').includes('ability_michelle_tough_gamble'), relative(ROOT, p)).toBe(false);
	});

	it('her passive id has a rule and no function stub', () => {
		const def = MOSJES.find((m) => m.id === 'mosje_michelle');
		expect(MOSJE_ABILITY_RULES[def.abilityId]).toBeTruthy();
		expect(mosjeAbilities[def.abilityId]).toBeUndefined();
	});

	it('the tray shows no Ability chip for Michelle', () => {
		const def = MOSJES.find((m) => m.id === 'mosje_michelle');
		const slot = createMosjeSlot(def, { level: 1, mp: 40 });
		const state = makeEngineState({ turnNumber: 3, players: { player_1: { activeSlots: [slot, null] }, player_2: { activeSlots: [null, null] } } });
		expect(getAbilityChip(state, 'player_1', 0)).toBeNull();
	});
});
