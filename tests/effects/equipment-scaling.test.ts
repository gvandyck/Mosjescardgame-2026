// BAL-01: Equipment MP scaling by Digital subtype and Mosje level
// Filled in by Plan 03 (Wave 2)
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_keyboard, effect_mouse, effect_controller, effect_tikker } from '../../src/abilities/piecieEffects.js';
// @ts-expect-error — JS module, no type declarations
import { checkQuestCondition } from '../../src/engine/quests/checkQuestCondition.js';
// @ts-expect-error - JavaScript module has no type declarations
import { getQuestDef } from '../../src/engine/quests/getQuestDef.js';

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

describe('Gear Piecies on the Card List 2.0 (replaces the V4 BAL-01 scaling)', () => {
  describe('effect_keyboard', () => {
    it('gives a flat 10 MP at any level (Card List: no scaling)', () => {
      for (const level of [1, 2, 3]) {
        const result = effect_keyboard(makeState({ subtype: 'DIGITAL', level, mp: 0 }), 'player_1');
        expect(result.players.player_1.activeSlots[0].mp).toBe(10);
      }
    });

    it('draws 1 card', () => {
      const state = makeState({ subtype: 'DIGITAL', level: 1, deckCards: ['piecie_pot_of_weed'] });
      const result = effect_keyboard(state, 'player_1');
      expect(result.players.player_1.hand.length).toBe(1);
    });
  });

  describe('effect_mouse (interim: the deck peek comes with 59-05)', () => {
    it('gives a flat 10 MP', () => {
      const result = effect_mouse(makeState({ subtype: 'DIGITAL', level: 2, mp: 0 }), 'player_1');
      expect(result.players.player_1.activeSlots[0].mp).toBe(10);
    });
  });

  describe('effect_controller', () => {
    it('gives a flat 10 MP at any level', () => {
      for (const level of [1, 2, 3]) {
        const result = effect_controller(makeState({ subtype: 'DIGITAL', level, mp: 0 }), 'player_1');
        expect(result.players.player_1.activeSlots[0].mp).toBe(10);
      }
    });

    it('gives +1 die on one Quest this turn (questExtraDice)', () => {
      const result = effect_controller(makeState({ subtype: 'DIGITAL', level: 1 }), 'player_1');
      expect(result.players.player_1.questExtraDice).toBe(1);
    });
  });

  describe('effect_tikker', () => {
    it('gains exactly 40 MP flat (no dice roll)', () => {
      const result = effect_tikker(makeState({ subtype: 'DIGITAL', level: 1, mp: 0 }), 'player_1', { slotIndex: -1 });
      expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    });

    it('marks the Staying Tikker slot with the Mosje it blocks', () => {
      const state: any = makeState({ subtype: 'DIGITAL', level: 1 });
      state.players.player_1.piecieSlots[2] = { cardId: 'piecie_tikker', type: 'PIECIE' };
      const result = effect_tikker(state, 'player_1', { slotIndex: 2 });
      expect(result.players.player_1.piecieSlots[2].blockedMosjeSlot).toBe(0);
    });
  });

  describe('Tikker quest block (checkQuestCondition)', () => {
    const QUEST = getQuestDef('quest_arm_wrestling');
    const withTikker = (activatedRound: number) => {
      const state: any = makeState({});
      state.turnNumber = 5;
      state.players.player_1.piecieSlots[0] = {
        cardId: 'piecie_tikker', type: 'PIECIE', stays: true, staysEnd: 'custom', blockedMosjeSlot: 0, activatedRound,
      };
      return state;
    };

    it('refuses a Quest on the next turn of the owner while the Tikker still Stays', () => {
      expect(checkQuestCondition(withTikker(4), 'player_1', 0, QUEST).ok).toBe(false);
    });

    it('does not block on the turn the Tikker was played', () => {
      expect(checkQuestCondition(withTikker(5), 'player_1', 0, QUEST).ok).toBe(true);
    });

    it('allows the same Quest without a Tikker', () => {
      expect(checkQuestCondition(makeState({}), 'player_1', 0, QUEST).ok).toBe(true);
    });
  });
});
