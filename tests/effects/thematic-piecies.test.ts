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
import { activatePiecie, endTurn, applyPerfectRhythmDraw } from '../../src/engine/turnManager.js';

type StateOptions = {
  cardId?: string;
  mp?: number;
  tags?: string[];
  activeSlots?: Array<Record<string, unknown> | null>;
  hand?: Array<{ cardId: string; type: string }>;
  deck?: Array<{ cardId: string; type: string }>;
  piecieSlots?: Array<Record<string, unknown> | null>;
  perfectRhythmDrawNextPiecie?: boolean;
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
    energy: 6,
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
    ['piecie_loaded_dice', '★', false],
    ['piecie_boosterpackkie', '★★', false],
    ['piecie_perfect_rhythm', '★★', false],
    ['piecie_dikke_plaat', '★', false],
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
      expect(card?.persistUntilEndOfTurn).toBeUndefined(); // V4 field gone (57-02)
      expect(persists).toBe(false); // 2.0: none of these Stay
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

// 2.0 Card List: both give "+1 die on one Quest this turn" (player.questExtraDice). The Jeffrey / DJ / Alyssa
// Fissa Fissa! "reroll 1 die" half is a KNOWN GAP (Phase 59), so the die count never depends on those Mosjes.
describe('Loaded Dice and Dikke Plaat', () => {
  const cases: Array<[string, any]> = [
    ['no special Mosje', undefined],
    ['a Jeffrey (Gambler)', { cardId: 'mosje_jeffrey_gambler' }],
    ['a JEFFREY-tagged Mosje', { cardId: 'mosje_future_jeffrey', tags: ['JEFFREY'] }],
    ['DJ 80/20', { cardId: 'mosje_dj_8020' }],
    ['Alyssa, Fissa Fissa!', { cardId: 'mosje_alyssa_fissa' }],
  ];
  for (const [label, opts] of cases) {
    it(`Loaded Dice gives exactly +1 die with ${label}`, () => {
      const result = effect_loaded_dice(makeState(opts), 'player_1');
      expect(result.players.player_1.questExtraDice).toBe(1);
      expect(result.players.player_1.questPrepBonus).toBe(0);
    });
    it(`Dikke Plaat gives exactly +1 die with ${label}`, () => {
      const result = effect_dikke_plaat(makeState(opts), 'player_1');
      expect(result.players.player_1.questExtraDice).toBe(1);
      expect(result.players.player_1.questPrepBonus).toBe(0);
    });
  }
});

describe('Boosterpackkie', () => {
  it('draws one card on rolls 1-4 and rolls exactly once (with a Coert; without one it does not roll)', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
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

  it('grants +10 MP (95 + 10 levels up, 2.0) with a COERT-tagged Mosje', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = effect_boosterpackkie(
      makeState({ cardId: 'mosje_coert_kasteluck', mp: 95 }),
      'player_1',
    );

    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
    expect(result.players.player_1.activeSlots[0].level).toBe(2);
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

  // Phase 59 (Card List 2.0): the +10 comes with each later Piecie activation, not with Rhythm itself.
  it('grants +10 MP (95 + 10 levels up, 2.0) on a later activation, only for exact mosje_chris_ddr', () => {
    const result = applyPerfectRhythmDraw(
      effect_perfect_rhythm(makeState({ cardId: 'mosje_chris_ddr', mp: 95 }), 'player_1'),
      'player_1',
      true,
    );
    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
    expect(result.players.player_1.activeSlots[0].level).toBe(2);
  });

  it('grants +10 MP to exact DDR Chris instead of an unrelated first slot', () => {
    const result = applyPerfectRhythmDraw(
      effect_perfect_rhythm(
        makeState({
          activeSlots: [
            makeMosje('mosje_gandoe_destroyer', 40),
            makeMosje('mosje_chris_ddr', 50),
          ],
        }),
        'player_1',
      ),
      'player_1',
      true,
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

  it('draws after a ready Piecie chained for free by DDR Chris', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const state = makeState({
      activeSlots: [makeMosje('mosje_chris_ddr'), null],
      perfectRhythmDrawNextPiecie: true,
      energy: 6,
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
        { cardId: 'piecie_redbull', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 },
        null,
        null,
      ],
    });

    const result = activatePiecie(state, 'player_1', 0);
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.ddrChainsThisTurn).toBe(1); // slot 1 was chained for free (2.0: from the field)
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
    // V4: stayed in slot until end of turn. 2.0: non-Stays Piecie goes to discard at once.
    expect(first.state.players.player_1.piecieSlots[0]).toBeNull();
    expect(first.state.players.player_1.graveyard.map((g: any) => g.cardId)).toContain('piecie_perfect_rhythm');

    const second = activatePiecie(first.state, 'player_1', 1);
    expect(second.state.players.player_1.hand).toHaveLength(1);
    expect(second.state.players.player_1.perfectRhythmDrawNextPiecie).toBe(true);
    expect(second.state.players.player_1.piecieSlots[1]).toBeNull(); // V4: stayed; 2.0: discarded

    const third = activatePiecie(second.state, 'player_1', 2);
    expect(third.state.players.player_1.hand).toHaveLength(2);
    expect(third.state.players.player_1.deck).toHaveLength(0);
  });

  it('clears an unused flag at end of turn', () => {
    const result = endTurn(makeState({ perfectRhythmDrawNextPiecie: true }));
    expect(result.players.player_1.perfectRhythmDrawNextPiecie).toBe(false);
  });
});
