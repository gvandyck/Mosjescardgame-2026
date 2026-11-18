// Phase 71-01 (D-05): every Mosje has a friend as data.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';

const byId = (id: string) => MOSJES.find((m: any) => m.id === id);
const STARTER: Record<string, string> = {
  mosje_alyssa_bulldozer: 'Alyssa', mosje_chris_ddr: 'Chris', mosje_jeffrey: 'Jeffrey', mosje_jeffrey_gambler: 'Jeffrey',
  mosje_michelle: 'Michelle', mosje_ronald_chef: 'Ronald', mosje_ronald_mastermind: 'Ronald', mosje_coert_tech: 'Coert',
  mosje_fps_coert: 'Coert', mosje_fps_west: 'West', mosje_gandoe_wizard: 'Gandoe', mosje_youri: 'Youri',
  mosje_binti: 'Binti', mosje_dj_8020: 'DJ', mosje_ming_natural: 'Ming',
};

describe('Mosje friend field', () => {
  for (const [id, friend] of Object.entries(STARTER)) {
    it(`${id} is a ${friend}`, () => expect(byId(id)?.friend).toBe(friend));
  }
  it('every Mosje has a non-empty friend string', () => {
    for (const m of MOSJES) expect(typeof m.friend === 'string' && m.friend.length > 0, m.id).toBe(true);
  });
});
