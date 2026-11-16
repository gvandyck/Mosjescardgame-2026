// Phase 70-06 (D-07): the 12 starter Personal Quests carry structured Needs and Pay as data.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { PERSONAL_QUESTS } from '../../src/data/personalQuests.js';
// @ts-ignore JS module
import { NEED_KINDS } from '../../src/engine/needs/needKinds.js';
// @ts-ignore JS module
import { COST_KINDS } from '../../src/engine/costs/costKinds.js';

const byId = (id: string) => PERSONAL_QUESTS.find((q: any) => q.id === id);

const EXPECTED: Record<string, { needs: any[]; pay: any[] }> = {
  pq_charge: { needs: [{ kind: 'mosjeMinMP', amount: 31 }], pay: [{ kind: 'mpLoss', amount: 30 }] },
  pq_sterke_jongen: { needs: [{ kind: 'placeInPlay', placeId: 'place_the_gym' }], pay: [{ kind: 'discardReadyPiecie', tag: 'gear', count: 1 }] },
  pq_knocked_down_not_out: { needs: [{ kind: 'mosjeLostMPSinceLastTurnStart' }, { kind: 'mosjeMinMP', amount: 50 }], pay: [{ kind: 'discardReadyPiecie', tag: 'food', count: 1 }] },
  pq_michelinster: { needs: [{ kind: 'readyPiecie', name: 'piecie_ronald_kip', count: 1 }, { kind: 'mosjesOnField', count: 2 }], pay: [{ kind: 'discardFromHand', tag: 'food', count: 1 }] },
  pq_aloha_tech_support: { needs: [{ kind: 'readyPiecie', tag: 'gear', count: 1 }, { kind: 'handSizeOther', count: 5 }], pay: [{ kind: 'energy', amount: 2 }] },
  pq_vibe_coded: { needs: [{ kind: 'readyPiecie', tag: 'gear', count: 1 }], pay: [] },
  pq_world_record_run: { needs: [], pay: [{ kind: 'discardFromHand', tag: 'gear', count: 2 }] },
  pq_headshot: { needs: [{ kind: 'readyPiecie', tag: 'gear', count: 1 }], pay: [] },
  pq_beginners_luck: { needs: [], pay: [{ kind: 'energy', amount: 1 }] },
  pq_high_roller: { needs: [], pay: [{ kind: 'energyAny' }] },
  pq_lucky_crescendo: { needs: [{ kind: 'placeInPlay', placeId: 'place_skiffa' }], pay: [] },
  pq_binti_brandt: { needs: [{ kind: 'opponentHandMax', count: 2 }], pay: [{ kind: 'discardFromHand', type: 'PIECIE', count: 1 }] },
};

describe('Personal Quest Needs / Pay data', () => {
  it('every card has needs and pay arrays with registered kinds', () => {
    expect(PERSONAL_QUESTS).toHaveLength(12);
    for (const q of PERSONAL_QUESTS) {
      expect(Array.isArray(q.needs), q.id).toBe(true);
      expect(Array.isArray(q.pay), q.id).toBe(true);
      for (const n of q.needs) expect(NEED_KINDS[n.kind], `${q.id} need ${n.kind}`).toBeTruthy();
      for (const p of q.pay) expect(COST_KINDS[p.kind], `${q.id} pay ${p.kind}`).toBeTruthy();
    }
  });
  it('an empty list exactly when the card has no such line', () => {
    for (const q of PERSONAL_QUESTS) {
      expect(q.needs.length === 0, `${q.id} needs`).toBe(q.needsText === null);
      expect(q.pay.length === 0, `${q.id} pay`).toBe(q.payText === null);
    }
  });
  for (const [id, want] of Object.entries(EXPECTED)) {
    it(`${id} matches its printed lines`, () => {
      const q = byId(id);
      expect(q.needs).toEqual(want.needs);
      expect(q.pay).toEqual(want.pay);
    });
  }
});
