// mpCost tribute audit ruling regression guard (Phase 36-01).
// Per the 2026-07-16 ruling audit (.planning/audits/2026-07-16-piecie-snelle-cost-audit.md):
// every Piecie/Snelle Piecie's mpCost must match what its own printed text actually promises.
// Only piecie_welloe_force ("Pay 40 MP...") states first-person self-payment; every other
// currently-nonzero-mpCost card corrects to 0. This test guards against future drift back to
// a large uncharged-cost surface.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from '../../src/data/piecies.js';
// @ts-expect-error — JS module, no type declarations
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';

type Card = { id: string; mpCost: number };

describe('mpCost tribute audit ruling', () => {
  it('every Piecie except piecie_welloe_force has mpCost === 0', () => {
    const violations = (PIECIES as Card[])
      .filter((c) => c.id !== 'piecie_welloe_force' && c.mpCost !== 0)
      .map((c) => `${c.id}: mpCost=${c.mpCost}`);
    expect(violations).toEqual([]);
  });

  it('piecie_welloe_force has mpCost === 40', () => {
    const card = (PIECIES as Card[]).find((c) => c.id === 'piecie_welloe_force');
    expect(card?.mpCost).toBe(40);
  });

  it('every Snelle Piecie has mpCost === 0', () => {
    const violations = (SNELLE_PIECIES as Card[])
      .filter((c) => c.mpCost !== 0)
      .map((c) => `${c.id}: mpCost=${c.mpCost}`);
    expect(violations).toEqual([]);
  });

  it('exactly 1 card across PIECIES+SNELLE_PIECIES has mpCost > 0', () => {
    const nonZero = [...(PIECIES as Card[]), ...(SNELLE_PIECIES as Card[])].filter(
      (c) => c.mpCost > 0
    );
    expect(nonZero.map((c) => c.id)).toEqual(['piecie_welloe_force']);
  });
});
