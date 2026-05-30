// BAL-01: Equipment MP scaling by Digital subtype and Mosje level
// Filled in by Plan 03 (Wave 2)
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_keyboard, effect_mouse, effect_controller, effect_tikker } from '../../src/abilities/piecieEffects.js';
// @ts-expect-error — JS module, no type declarations
import { canAttemptGeneralQuest, canAttemptPersonalQuest } from '../../src/abilities/questLogic.js';

function makeState(overrides: {
  subtype?: string;
  level?: number;
  mp?: number;
  statusEffects?: Array<{ type: string; value: number; turnsLeft: number }>;
  deckCards?: string[];
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
            cardId: 'mosje_coert_tech',
            name: 'Coert',
            subtype: overrides.subtype ?? 'DIGITAL',
            traits: { technical: 2 },
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

describe('Equipment MP scaling (BAL-01)', () => {
  describe('effect_keyboard', () => {
    it('gives 15 MP with Digital Mosje at level 1', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(15);
    });

    it('gives 25 MP with Digital Mosje at level 2', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 2, mp: 0 });
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 40 MP with Digital Mosje at level 3', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 3, mp: 0 });
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('gives 5 MP base with non-Digital Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(5);
    });

    it('draws 1 card as flavor bonus with Digital Mosje', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, deckCards: ['piecie_pot_of_weed'] });
      const handBefore = state.players.player_1.hand.length;
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(handBefore + 1);
    });

    it('draws 1 card as flavor bonus with non-Digital Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, deckCards: ['piecie_pot_of_weed'] });
      const handBefore = state.players.player_1.hand.length;
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(handBefore + 1);
    });
  });

  describe('effect_mouse', () => {
    it('gives 15 MP with Digital Mosje at level 1', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_mouse(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(15);
    });

    it('gives 25 MP with Digital Mosje at level 2', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 2, mp: 0 });
      const result = effect_mouse(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 40 MP with Digital Mosje at level 3', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 3, mp: 0 });
      const result = effect_mouse(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('gives 5 MP base with non-Digital Mosje', () => {
      const state = makeState({ subtype: 'FIGHTING', level: 1, mp: 0 });
      const result = effect_mouse(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(5);
    });

    it('draws 1 card as flavor bonus', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, deckCards: ['piecie_pot_of_weed'] });
      const handBefore = state.players.player_1.hand.length;
      const result = effect_mouse(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(handBefore + 1);
    });
  });

  describe('effect_controller', () => {
    it('gives 15 MP with Digital Mosje at level 1', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_controller(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(15);
    });

    it('gives 25 MP with Digital Mosje at level 2', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 2, mp: 0 });
      const result = effect_controller(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(25);
    });

    it('gives 40 MP with Digital Mosje at level 3', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 3, mp: 0 });
      const result = effect_controller(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('gives 5 MP base with non-Digital Mosje', () => {
      const state = makeState({ subtype: 'ARTISTIC', level: 1, mp: 0 });
      const result = effect_controller(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(5);
    });

    it('sets questPrepBonus +1 as flavor bonus', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1 });
      const result = effect_controller(state, 'player_1');
      expect(result.players.player_1.questPrepBonus).toBe(1);
    });
  });

  describe('effect_tikker', () => {
    it('gains exactly 40 MP flat (no dice roll)', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, mp: 0 });
      const result = effect_tikker(state, 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('pushes QUEST_BLOCKED status effect with turnsLeft=1', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1 });
      const result = effect_tikker(state, 'player_1');
      const statusEffects = result.players.player_1.activeSlots[0].statusEffects;
      const blocked = statusEffects.find((e: { type: string }) => e.type === 'QUEST_BLOCKED');
      expect(blocked).toBeDefined();
      expect(blocked.turnsLeft).toBe(1);
    });
  });

  describe('QUEST_BLOCKED enforcement', () => {
    const GENERAL_QUEST = {
      id: 'quest_arm_wrestling',
      requirementId: 'quest_req_arm_wrestling',
      successMP: 30,
      failMP: 0,
    };

    const PERSONAL_QUEST = {
      id: 'quest_west_perfect_read',
      requiredMosjeId: 'mosje_coert_tech',
      requirementId: 'quest_req_coert',
      successMP: 50,
      failMP: -10,
    };

    it('canAttemptGeneralQuest returns false when QUEST_BLOCKED is active', () => {
      const state = makeState({
        statusEffects: [{ type: 'QUEST_BLOCKED', value: 1, turnsLeft: 1 }],
      });
      expect(canAttemptGeneralQuest(GENERAL_QUEST, state, 'player_1')).toBe(false);
    });

    it('canAttemptPersonalQuest returns false when QUEST_BLOCKED is active', () => {
      const state = makeState({
        statusEffects: [{ type: 'QUEST_BLOCKED', value: 1, turnsLeft: 1 }],
      });
      expect(canAttemptPersonalQuest(PERSONAL_QUEST, state, 'player_1')).toBe(false);
    });
  });
});
