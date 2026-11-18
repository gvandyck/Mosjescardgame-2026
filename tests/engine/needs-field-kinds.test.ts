// Phase 71-01: Need kinds fieldMosjeType and fieldFriend.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { checkNeeds } from '../../src/engine/needs/checkNeeds.js';
// @ts-ignore JS module
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore JS module
import { mkSlot } from '../helpers/quest56.js';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';

const slotOf = (id: string) => mkSlot({}, MOSJES.find((m: any) => m.id === id));
const run = (id: string, need: any) => checkNeeds(
  { state: makeEngineState({ players: { player_1: { activeSlots: [slotOf(id), null] }, player_2: { activeSlots: [null, null] } } }), playerId: 'player_1', slotIndex: 1, cardId: 'x' },
  [need]);

describe('fieldMosjeType', () => {
  it('ok with a Mosje of that type, else a reason', () => {
    expect(run('mosje_alyssa_bulldozer', { kind: 'fieldMosjeType', type: 'PHYSICAL' }).ok).toBe(true);
    const r = run('mosje_youri', { kind: 'fieldMosjeType', type: 'PHYSICAL' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('Needs a Physical Mosje');
  });
});
describe('fieldFriend', () => {
  it('ok with a listed friend, reason names them', () => {
    expect(run('mosje_fps_west', { kind: 'fieldFriend', friends: ['Martin', 'West'] }).ok).toBe(true);
    const r = run('mosje_youri', { kind: 'fieldFriend', friends: ['Martin', 'West'] });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('Needs a Martin or a West');
  });
});
