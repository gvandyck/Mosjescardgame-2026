import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import { PIECIES } from '../../src/data/piecies.js';
// @ts-expect-error - JavaScript module has no type declarations
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-expect-error - JavaScript module has no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-expect-error - JavaScript module has no type declarations
import {
  effect_boosterpackkie,
  effect_dikke_plaat,
  effect_loaded_dice,
  effect_perfect_rhythm,
} from '../../src/abilities/piecieEffects.js';
// @ts-expect-error - JavaScript module has no type declarations
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';

type StateOptions = {
  cardId?: string;
  mp?: number;
  tags?: string[];
  activeSlots?: Array<Record<string, unknown> | null>;
  hand?: Array<{ cardId: string; type: string }>;
  deck?: Array<{ cardId: string; type: string }>;
  piecieSlots?: Array<Record<string, unknown> | null>;
  perfectRhythmDrawNextPiecie?: boolean;
  chrisDdrChainUsesThisTurn?: number;
};

function makeMosje(cardId: string, mp = 50, tags?: string[]) {
  return {
    cardId,
    name: cardId,
    subtype: 'ARTISTIC',
    tags,
    traits: {},
    mp,
    level: 1,
    isDefeated: false,
    statusEffects: [],
    abilityUsedThisTurn: false,
    mpLostThisTurn: 0,
  };
}

function makePlayer(options: StateOptions = {}) {
  return {
    playerId: 'player_1',
    hand: options.hand ?? [],
    deck: options.deck ?? [],
    graveyard: [],
    activeSlots:
      options.activeSlots ??
      [makeMosje(options.cardId ?? 'mosje_chris', options.mp, options.tags), null],
    piecieSlots: options.piecieSlots ?? [null, null, null, null],
    questPrepBonus: 0,
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesActivatedThisTurn: 0,
    pieciesPlayedThisTurn: 0,
    actionsThisTurn: [],
    totalDamageTaken: 0,
    perfectRhythmDrawNextPiecie: options.perfectRhythmDrawNextPiecie ?? false,
    chrisDdrChainUsesThisTurn: options.chrisDdrChainUsesThisTurn ?? 0,
  };
}

function makeState(options: StateOptions = {}) {
  return {
    roomCode: 'TEST',
    status: 'PLAYING',
    activePlayerId: 'player_1',
    turnNumber: 2,
    activePlace: null,
    activeQuest: null,
    sharedPlaceSlot: null,
    winnerId: null,
    winReason: null,
    _snelleFlags: {},
    _pendingTargets: {},
    sharedGeneralQuestDiscard: [],
    players: {
      player_1: makePlayer(options),
      player_2: {
        ...makePlayer({ cardId: 'mosje_gandoe_destroyer' }),
        playerId: 'player_2',
      },
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Phase 46 thematic Piecie definitions', () => {
  const expected = [
    ['piecie_loaded_dice', '★', true],
    ['piecie_boosterpackkie', '★★', false],
    ['piecie_perfect_rhythm', '★★', true],
    ['piecie_dikke_plaat', '★', true],
  ] as const;

  for (const [id, rarity, persists] of expected) {
    it(`${id} has the approved booster-only fields`, () => {
      const card = PIECIES.find((entry: { id: string }) => entry.id === id);
      expect(card).toMatchObject({
        id,
        type: 'PIECIE',
        subtype: 'UTILITY',
        mpCost: 0,
        requirement: 'any',
        artPath: 'assets/piecies/placeholder.png',
        rarity,
        isBoosterOnly: true,
      });
      expect(card?.persistUntilEndOfTurn === true).toBe(persists);
    });
  }

  it('keeps all four cards out of starter decks and eligible for the booster pool', () => {
    for (const [id] of expected) {
      const card = PIECIES.find((entry: { id: string }) => entry.id === id);
      expect(card?.disabled).not.toBe(true);
      // Obby 2.0: Boosterpackkie is a Regelaars Example Deck card (Example Decks doc),
      // so it is the one exception to the "not in a starter deck" rule.
      const inDecks = STARTER_DECKS
        .filter((deck: { piecies?: string[] }) => deck.piecies?.includes(id))
        .map((deck: { id: string }) => deck.id);
      expect(inDecks).toEqual(id === 'piecie_boosterpackkie' ? ['EXAMPLE_REGELAARS'] : []);
    }
  });

  it('preserves the two no-code thematic decisions', () => {
    const kastelein = MOSJES.find(
      (entry: { id: string }) => entry.id === 'mosje_coert_kastelein',
    );
    expect(kastelein?.disabled).toBe(true);
    expect(
      PIECIES.some((card: { name?: string; description?: string }) =>
        /all-rounder/i.test(`${card.name ?? ''} ${card.description ?? ''}`),
      ),
    ).toBe(false);
  });
});

describe('Loaded Dice and Dikke Plaat', () => {
  it('Loaded Dice gives +1 without a JEFFREY Mosje', () => {
    const result = effect_loaded_dice(makeState(), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(1);
  });

  it('Loaded Dice gives +2 from canonical JEFFREY card data', () => {
    const result = effect_loaded_dice(makeState({ cardId: 'mosje_jeffrey_gambler' }), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(2);
  });

  it('Loaded Dice supports future JEFFREY family members via slot tags', () => {
    const result = effect_loaded_dice(
      makeState({ cardId: 'mosje_future_jeffrey', tags: ['JEFFREY'] }),
      'player_1',
    );
    expect(result.players.player_1.questPrepBonus).toBe(2);
  });

  it('Dikke Plaat gives +1 without a DJ Mosje', () => {
    const result = effect_dikke_plaat(makeState(), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(1);
  });

  it('Dikke Plaat gives +2 from canonical DJ card data', () => {
    const result = effect_dikke_plaat(makeState({ cardId: 'mosje_dj_8020' }), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(2);
  });

  it('Dikke Plaat gives +2 with [Alyssa] Fissa Fissa! on field', () => {
    const result = effect_dikke_plaat(makeState({ cardId: 'mosje_alyssa_fissa' }), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(2);
  });

  it('Dikke Plaat stays +1 with Alyssa Bulldozer on field', () => {
    const result = effect_dikke_plaat(makeState({ cardId: 'mosje_alyssa_bulldozer' }), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(1);
  });
});

describe('Boosterpackkie', () => {
  it('draws one card on rolls 1-4 and rolls exactly once', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = effect_boosterpackkie(
      makeState({
        deck: [
          { cardId: 'draw_1', type: 'PIECIE' },
          { cardId: 'draw_2', type: 'PIECIE' },
        ],
      }),
      'player_1',
    );

    expect(result.players.player_1.hand.map((card: { cardId: string }) => card.cardId)).toEqual(['draw_1']);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('draws a second card on rolls 5-6 with a COERT Mosje on field', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = effect_boosterpackkie(
      makeState({
        cardId: 'mosje_coert_kasteluck',
        deck: [
          { cardId: 'draw_1', type: 'PIECIE' },
          { cardId: 'draw_2', type: 'PIECIE' },
        ],
      }),
      'player_1',
    );

    expect(result.players.player_1.hand).toHaveLength(2);
  });

  it('does not draw a second card on 5-6 without a COERT Mosje', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = effect_boosterpackkie(
      makeState({
        deck: [
          { cardId: 'draw_1', type: 'PIECIE' },
          { cardId: 'draw_2', type: 'PIECIE' },
        ],
      }),
      'player_1',
    );

    expect(result.players.player_1.hand).toHaveLength(1);
  });

  it('grants capped +10 MP with a COERT-tagged Mosje', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = effect_boosterpackkie(
      makeState({ cardId: 'mosje_coert_kasteluck', mp: 95 }),
      'player_1',
    );

    expect(result.players.player_1.activeSlots[0].mp).toBe(100);
    expect(result.players.player_1.activeSlots[0].level).toBe(1);
  });

  it('does not grant MP without a COERT-tagged Mosje', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = effect_boosterpackkie(makeState({ mp: 50 }), 'player_1');
    expect(result.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it('grants +10 MP to the qualifying COERT Mosje instead of an unrelated first slot', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = effect_boosterpackkie(
      makeState({
        activeSlots: [
          makeMosje('mosje_gandoe_destroyer', 40),
          makeMosje('mosje_coert_kasteluck', 50),
        ],
      }),
      'player_1',
    );

    expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    expect(result.players.player_1.activeSlots[1].mp).toBe(60);
  });
});

describe('Perfect Rhythm', () => {
  it('arms the next-activation draw without exact DDR Chris', () => {
    const result = effect_perfect_rhythm(makeState({ cardId: 'mosje_chris', mp: 50 }), 'player_1');
    expect(result.players.player_1.perfectRhythmDrawNextPiecie).toBe(true);
    expect(result.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it('grants capped +10 MP only for exact mosje_chris_ddr', () => {
    const result = effect_perfect_rhythm(
      makeState({ cardId: 'mosje_chris_ddr', mp: 95 }),
      'player_1',
    );
    expect(result.players.player_1.activeSlots[0].mp).toBe(100);
    expect(result.players.player_1.activeSlots[0].level).toBe(1);
  });

  it('grants +10 MP to exact DDR Chris instead of an unrelated first slot', () => {
    const result = effect_perfect_rhythm(
      makeState({
        activeSlots: [
          makeMosje('mosje_gandoe_destroyer', 40),
          makeMosje('mosje_chris_ddr', 50),
        ],
      }),
      'player_1',
    );

    expect(result.players.player_1.activeSlots[0].mp).toBe(40);
    expect(result.players.player_1.activeSlots[1].mp).toBe(60);
  });

  it('does not consume its flag on its own activation', () => {
    const state = makeState({
      deck: [{ cardId: 'draw_1', type: 'PIECIE' }],
      piecieSlots: [
        {
          cardId: 'piecie_perfect_rhythm',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        null,
        null,
        null,
      ],
    });

    const result = activatePiecie(state, 'player_1', 0);
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.perfectRhythmDrawNextPiecie).toBe(true);
    expect(result.state.players.player_1.hand).toHaveLength(0);
  });

  it('draws once for every later Piecie activation this turn', () => {
    const state = makeState({
      perfectRhythmDrawNextPiecie: true,
      deck: [
        { cardId: 'draw_1', type: 'PIECIE' },
        { cardId: 'draw_2', type: 'PIECIE' },
      ],
      piecieSlots: [
        {
          cardId: 'piecie_mp_amplifier',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        {
          cardId: 'piecie_redbull',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        null,
        null,
      ],
    });

    const first = activatePiecie(state, 'player_1', 0);
    expect(first.state.players.player_1.hand).toHaveLength(1);
    expect(first.state.players.player_1.perfectRhythmDrawNextPiecie).toBe(true);
    expect(first.state.players.player_1.deck).toHaveLength(1);

    const second = activatePiecie(first.state, 'player_1', 1);
    expect(second.state.players.player_1.hand).toHaveLength(2);
    expect(second.state.players.player_1.deck).toHaveLength(0);
  });

  it('draws after a Piecie automatically chained by DDR Chris', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const state = makeState({
      activeSlots: [makeMosje('mosje_chris_ddr'), null],
      perfectRhythmDrawNextPiecie: true,
      chrisDdrChainUsesThisTurn: 2,
      hand: [{ cardId: 'piecie_redbull', type: 'PIECIE' }],
      deck: [
        { cardId: 'draw_1', type: 'PLACE' },
        { cardId: 'draw_2', type: 'PLACE' },
      ],
      piecieSlots: [
        {
          cardId: 'piecie_mp_amplifier',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        null,
        null,
        null,
      ],
    });

    const result = activatePiecie(state, 'player_1', 0);
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.chrisDdrChainUsesThisTurn).toBe(3);
    expect(
      result.state.players.player_1.hand.map((card: { cardId: string }) => card.cardId),
    ).toEqual(['draw_1', 'draw_2']);
    expect(result.state.players.player_1.deck).toHaveLength(0);
  });

  it('lets a later Perfect Rhythm copy draw from the earlier non-stacking flag', () => {
    const state = makeState({
      deck: [
        { cardId: 'draw_1', type: 'PLACE' },
        { cardId: 'draw_2', type: 'PLACE' },
      ],
      piecieSlots: [
        {
          cardId: 'piecie_perfect_rhythm',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        {
          cardId: 'piecie_perfect_rhythm',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        {
          cardId: 'piecie_mp_amplifier',
          type: 'PIECIE',
          faceDown: true,
          activated: false,
          playedOnTurn: 1,
          canActivateOnTurn: 2,
        },
        null,
      ],
    });

    const first = activatePiecie(state, 'player_1', 0);
    expect(first.state.players.player_1.hand).toHaveLength(0);
    expect(first.state.players.player_1.piecieSlots[0]).toMatchObject({
      cardId: 'piecie_perfect_rhythm',
      faceDown: false,
      persistUntilEoT: true,
    });

    const second = activatePiecie(first.state, 'player_1', 1);
    expect(second.state.players.player_1.hand).toHaveLength(1);
    expect(second.state.players.player_1.perfectRhythmDrawNextPiecie).toBe(true);
    expect(second.state.players.player_1.piecieSlots[1]).toMatchObject({
      cardId: 'piecie_perfect_rhythm',
      faceDown: false,
      persistUntilEoT: true,
    });

    const third = activatePiecie(second.state, 'player_1', 2);
    expect(third.state.players.player_1.hand).toHaveLength(2);
    expect(third.state.players.player_1.deck).toHaveLength(0);
  });

  it('clears an unused flag at end of turn', () => {
    const result = endTurn(makeState({ perfectRhythmDrawNextPiecie: true }));
    expect(result.players.player_1.perfectRhythmDrawNextPiecie).toBe(false);
  });
});
