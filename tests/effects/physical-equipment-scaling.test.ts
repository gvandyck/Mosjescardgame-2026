// PHYS-01/02/03: Physical Equipment effect tests
// TDD Phase: RED — all tests must fail until Task 2 implements the functions
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import {
  effect_dumbbells,
  effect_boxing_gloves,
  effect_skipping_rope,
  effect_protein_shake,
} from '../../src/abilities/piecieEffects.js';
// @ts-expect-error — JS module, no type declarations
import { effect_boxing_ring, effect_the_gym } from '../../src/abilities/placeEffects.js';

function makeState(overrides: {
  subtype?: string;
  level?: number;
  mp?: number;
  statusEffects?: Array<{ type: string; value: number; turnsLeft: number }>;
  deckCards?: string[];
  cardId?: string;
  traits?: Record<string, number>;
} = {}) {
  return {
    roomCode: 'TEST',
    status: 'PLAYING',
    activePlayerId: 'player_1',
    players: {
      player_1: {
        playerId: 'player_1',
        hand: [],
        deck: overrides.deckCards ?? ['piecie_pot_of_weed'],
        discard: [],
        welloe: [],
        questPrepBonus: 0,
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        totalDamageTaken: 0,
        piecieSlots: [null, null, null, null, null],
        activeSlots: [
          {
            cardId: overrides.cardId ?? 'mosje_coert_tech',
            name: 'Coert',
            subtype: overrides.subtype ?? 'DIGITAL',
            traits: overrides.traits ?? { technical: 2 },
            mp: overrides.mp ?? 0,
            level: overrides.level ?? 1,
            isDefeated: false,
            statusEffects: overrides.statusEffects ?? [],
            abilityUsedThisTurn: false,
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
      },
    },
  };
}

describe('Physical Equipment cards (PHYS-01/02/03)', () => {

  describe('effect_dumbbells', () => {
    it('gives 20 MP to FIGHTING Mosje at level 1', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(20);
    });

    it('gives 20 MP to FIGHTING Mosje at level 2', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 2, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(20);
    });

    it('gives 20 MP to FIGHTING Mosje at level 3', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 3, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(20);
    });

    it('gives 5 MP base to non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(5);
    });

    it('also draws 1 card at FIGHTING level 3', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 3, deckCards: ['x'] });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(1);
    });

    it('does not draw at FIGHTING level 2', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 2, deckCards: ['x'] });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(0);
    });

    it('does not draw with non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 3, deckCards: ['x'] });
      const result = effect_dumbbells(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(0);
    });
  });

  describe('effect_boxing_gloves', () => {
    const boxer = (over: any) => makeState({ subtype: 'FIGHTING', level: 1, mp: 0, ...over });

    it('gives +10 Power this turn to a Physical 2 stars Mosje (no MP)', () => {
      const result = effect_boxing_gloves(boxer({ traits: { physical: 2 } }), 'player_1');
      expect(result.players.player_1.activeSlots[0].powerBoostThisTurn).toBe(10);
      expect(result.players.player_1.activeSlots[0].mp).toBe(0);
    });

    it('does nothing when Physical is below 2 stars', () => {
      const result = effect_boxing_gloves(boxer({ traits: { physical: 1 } }), 'player_1');
      expect(result.players.player_1.activeSlots[0].powerBoostThisTurn).toBeUndefined();
    });

    it('gives a Gandoe +20 Power instead', () => {
      const result = effect_boxing_gloves(boxer({ cardId: 'mosje_gandoe_destroyer', traits: { physical: 3 } }), 'player_1');
      expect(result.players.player_1.activeSlots[0].powerBoostThisTurn).toBe(20);
    });
  });

  describe('effect_skipping_rope', () => {
    it('gives +1 questExtraDice with FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING' });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.questExtraDice).toBe(1);
    });

    it('draws 1 card with FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING', deckCards: ['x'] });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(1);
    });

    it('gives no extra die with non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL' });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.questExtraDice ?? 0).toBe(0);
    });

    it('still draws 1 card with non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', deckCards: ['x'] });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(1);
    });

    it('does not draw when deck is empty', () => {
      const state = makeState({ subtype: 'FIGHTING', deckCards: [] });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(0);
    });
  });
});

describe('Physical Equipment: Protein Shake + Boxing Ring (PHYS-04/05)', () => {

  describe('effect_protein_shake', () => {
    const fighter = (physical: number, extra: any = {}) =>
      ({ ...makeState({ subtype: 'FIGHTING', level: 1, mp: 0, traits: { physical } }), ...extra });

    it('gives 25 MP with Physical 1 star', () => {
      expect(effect_protein_shake(fighter(1), 'player_1').players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 35 MP with Physical 3 stars', () => {
      expect(effect_protein_shake(fighter(3), 'player_1').players.player_1.activeSlots[0].mp).toBe(35);
    });

    it('gives 35 MP while the Place is Boxing Ring', () => {
      const state = fighter(1, { activePlace: 'place_boxing_ring' });
      expect(effect_protein_shake(state, 'player_1').players.player_1.activeSlots[0].mp).toBe(35);
    });

    it('gives nothing without Physical 1 star', () => {
      expect(effect_protein_shake(fighter(0), 'player_1').players.player_1.activeSlots[0].mp).toBe(0);
    });

    it('does not mutate input state', () => {
      const state = fighter(1);
      effect_protein_shake(state, 'player_1');
      expect(state.players.player_1.activeSlots[0].mp).toBe(0);
    });
  });

  describe('effect_boxing_ring (START_PHASE)', () => {
    it('gives FIGHTING Mosje +10 MP at turn start', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 50 });
      const result = effect_boxing_ring(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(60);
    });

    it('gives GANDOE FIGHTING Mosje +20 MP at turn start', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 50, cardId: 'mosje_gandoe_destroyer' });
      const result = effect_boxing_ring(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(70);
    });

    it('gives 0 MP to non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 50 });
      const result = effect_boxing_ring(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(50);
    });

    it('skips defeated Mosjes', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 50 });
      state.players.player_1.activeSlots[0].isDefeated = true;
      const result = effect_boxing_ring(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(50);
    });
  });

});

describe('effect_the_gym CLESS patch (PHYS-06)', () => {
  it('CLESS Mosje (mosje_azn_cless) gains +20 MP instead of losing', () => {
    const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 30, cardId: 'mosje_azn_cless' });
    // Set physical trait < 2 so normal physical branch does NOT trigger
    state.players.player_1.activeSlots[0].traits = { physical: 1, social: 2 };
    const result = effect_the_gym(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(50); // 30 + 20
  });

  it('CLESS Mosje with physical >= 2 still gets physical bonus (not CLESS bonus)', () => {
    const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 30, cardId: 'mosje_azn_cless' });
    state.players.player_1.activeSlots[0].traits = { physical: 2, social: 2 };
    const result = effect_the_gym(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(55); // 30 + 25 (physical branch wins)
  });

  it('non-CLESS Mosje with physical < 2 still takes 10 MP damage', () => {
    const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 30 });
    const result = effect_the_gym(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(20); // 30 - 10
  });

  it('WEST Mosje (mosje_martin_senor_west) is neutral — no gain, no loss (WC balance fix)', () => {
    // West has no physical trait and isn't Cless, but he's Cless's synergy
    // partner — WC's own Place shouldn't drain its own team's other Mosje.
    const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 30, cardId: 'mosje_martin_senor_west' });
    state.players.player_1.activeSlots[0].traits = { mental: 3, technical: 1 };
    const result = effect_the_gym(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(30); // unchanged
  });

  it('WEST Mosje with physical >= 2 still gets the physical bonus (not the neutral carve-out)', () => {
    const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 30, cardId: 'mosje_martin_senor_west' });
    state.players.player_1.activeSlots[0].traits = { physical: 2, mental: 3 };
    const result = effect_the_gym(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(55); // 30 + 25 (physical branch wins)
  });
});
