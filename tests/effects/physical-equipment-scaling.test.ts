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
import { effect_boxing_ring } from '../../src/abilities/placeEffects.js';

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
    it('gives 25 MP to Physical ★★+ Mosje (no GANDOE)', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0, traits: { physical: 2 } });
      const result = effect_boxing_gloves(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 0 MP when Physical trait < 2', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0, traits: { physical: 1 } });
      const result = effect_boxing_gloves(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(0);
    });

    it('gives 40 MP when GANDOE-tagged Mosje', () => {
      const state = makeState({
        cardId: 'mosje_gandoe_destroyer',
        subtype: 'FIGHTING',
        level: 1,
        mp: 0,
        traits: { physical: 3 },
      });
      const result = effect_boxing_gloves(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('pushes MP_LOSS_HALVED turnsLeft:1 when GANDOE', () => {
      const state = makeState({
        cardId: 'mosje_gandoe_destroyer',
        subtype: 'FIGHTING',
        level: 1,
        mp: 0,
        traits: { physical: 3 },
      });
      const result = effect_boxing_gloves(state, 'player_1');
      const statusEffects = result.players.player_1.activeSlots[0].statusEffects;
      const halved = statusEffects.find((e: { type: string }) => e.type === 'MP_LOSS_HALVED');
      expect(halved).toBeDefined();
      expect(halved.turnsLeft).toBe(1);
    });

    it('does not push MP_LOSS_HALVED for non-GANDOE Physical', () => {
      const state = makeState({
        cardId: 'mosje_azn_cless',
        subtype: 'FIGHTING',
        level: 1,
        mp: 0,
        traits: { physical: 2 },
      });
      const result = effect_boxing_gloves(state, 'player_1');
      const statusEffects = result.players.player_1.activeSlots[0].statusEffects;
      const halved = statusEffects.find((e: { type: string }) => e.type === 'MP_LOSS_HALVED');
      expect(halved).toBeUndefined();
    });
  });

  describe('effect_skipping_rope', () => {
    it('gives +1 questPrepBonus with FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING' });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.questPrepBonus).toBe(1);
    });

    it('draws 1 card with FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING', deckCards: ['x'] });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(1);
    });

    it('gives 0 questPrepBonus with non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL' });
      const result = effect_skipping_rope(state, 'player_1');
      expect(result.players.player_1.questPrepBonus).toBe(0);
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
    it('gives 25 MP to FIGHTING Mosje (no Boxing Ring)', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
      const result = effect_protein_shake(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 35 MP to FIGHTING Mosje when Boxing Ring is active place', () => {
      const state = { ...makeState({ subtype: 'FIGHTING', level: 1, mp: 0 }), activePlace: 'place_boxing_ring' };
      const result = effect_protein_shake(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(35);
    });

    it('gives 0 MP to non-FIGHTING Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_protein_shake(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(0);
    });

    it('does not mutate input state', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
      effect_protein_shake(state, 'player_1');
      expect(state.players.player_1.activeSlots[0].mp).toBe(0);
    });
  });

  describe('effect_boxing_ring (END_PHASE — questCard undefined)', () => {
    it('gives FIGHTING Mosje +10 MP at end phase', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 50 });
      const result = effect_boxing_ring(state);
      expect(result.players.player_1.activeSlots[0].mp).toBe(60);
    });

    it('deals 5 MP damage to non-FIGHTING Mosje at end phase', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 50 });
      const result = effect_boxing_ring(state);
      expect(result.players.player_1.activeSlots[0].mp).toBe(45);
    });

    it('skips defeated Mosjes', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 50 });
      state.players.player_1.activeSlots[0].isDefeated = true;
      const result = effect_boxing_ring(state);
      expect(result.players.player_1.activeSlots[0].mp).toBe(50);
    });
  });

  describe('effect_boxing_ring (ON_QUEST — questCard defined)', () => {
    it('gives active Mosje +15 MP on any quest outcome (Physical Mosje)', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 30 });
      const result = effect_boxing_ring(state, { id: 'quest_arm_wrestling' }, true);
      expect(result.players.player_1.activeSlots[0].mp).toBe(45);
    });

    it('gives active Mosje +15 MP even on quest failure', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 30 });
      const result = effect_boxing_ring(state, { id: 'quest_arm_wrestling' }, false);
      expect(result.players.player_1.activeSlots[0].mp).toBe(45);
    });

    it('gives GANDOE Mosje +25 MP on quest (any outcome)', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 30, cardId: 'mosje_gandoe_destroyer' });
      const result = effect_boxing_ring(state, { id: 'quest_arm_wrestling' }, true);
      expect(result.players.player_1.activeSlots[0].mp).toBe(55);
    });
  });

});
