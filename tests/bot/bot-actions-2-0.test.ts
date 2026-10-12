// 56-05: the bot's 2.0 action choice (attack OR Quest) must always be engine-legal.
import { describe, expect, it } from 'vitest';
// @ts-expect-error JS module without type declarations
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-expect-error JS module without type declarations
import { mkSlot, byName } from '../helpers/quest56.js';
// @ts-expect-error JS module without type declarations
import { questWinChance } from '../../src/bot/strategy/questWinChance.js';
// @ts-expect-error JS module without type declarations
import { chooseMosjeAction } from '../../src/bot/strategy/chooseMosjeAction.js';
// @ts-expect-error JS module without type declarations
import { chooseQuestChoices } from '../../src/bot/strategy/chooseQuestChoices.js';
// @ts-expect-error JS module without type declarations
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
// @ts-expect-error JS module without type declarations
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';

function stacks(faceUp: Record<string, string | null> = {}) {
  const out: any = {};
  for (const id of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) out[id] = { deck: [], faceUp: faceUp[id] ?? null, tokens: 0, discard: [] };
  return out;
}
const board = (me: any, opp: any[], q: Record<string, string | null> = {}, p1: any = {}) =>
  makeEngineState({ questStacks: stacks(q), players: { player_1: { activeSlots: [me, null], ...p1 }, player_2: { activeSlots: opp } } });

describe('questWinChance (exact binomial)', () => {
  it('steady 1 die = 0.5, skilled 2 dice = 0.25, heroic 2 dice = 1/9, trained = 1', () => {
    expect(questWinChance('steady', 1)).toBeCloseTo(0.5);
    expect(questWinChance('skilled', 2)).toBeCloseTo(0.25);
    expect(questWinChance('heroic', 2)).toBeCloseTo(1 / 9);
    expect(questWinChance('trained', 0)).toBe(1);
  });
  it('more dice help: steady 2 dice = 0.75; skilled 3 dice = 0.5', () => {
    expect(questWinChance('steady', 2)).toBeCloseTo(0.75);
    expect(questWinChance('skilled', 3)).toBeCloseTo(0.5);
  });
});

describe('chooseMosjeAction', () => {
  it('attacks a non-fresh opponent, never a fresh or level-up-protected one', () => {
    const me = mkSlot({ mp: 60 });
    const s = board(me, [mkSlot({ mp: 40, entryProtected: true }), mkSlot({ mp: 40, levelUpProtected: true }), mkSlot({ mp: 40 })]);
    const a = chooseMosjeAction(s, 'player_1', 0);
    expect(a).toMatchObject({ kind: 'attack', targetPlayerId: 'player_2', targetSlotIndex: 2 });
    expect(attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: a.targetPlayerId, targetSlotIndex: a.targetSlotIndex }).ok).toBe(true);
  });

  it('a fresh Mosje cannot attack; with no Quest it does nothing', () => {
    const s = board(mkSlot({ mp: 60, entryProtected: true }), [mkSlot({ mp: 40 }), null]);
    expect(chooseMosjeAction(s, 'player_1', 0)).toBeNull();
  });

  it('does nothing when the Mosje already acted, is sideways, or the player is on cooldown', () => {
    const opp = [mkSlot({ mp: 40 }), null];
    expect(chooseMosjeAction(board(mkSlot({ actedThisTurn: true }), opp), 'player_1', 0)).toBeNull();
    expect(chooseMosjeAction(board(mkSlot({ sideways: true }), opp), 'player_1', 0)).toBeNull();
    expect(chooseMosjeAction(board(mkSlot(), opp, {}, { cooldownTurn: true }), 'player_1', 0)).toBeNull();
  });

  it('picks a Quest when there is no attack target, and the engine accepts it', () => {
    const s = board(mkSlot({ mp: 60 }), [null, null], { FIGHTING: 'quest_tough_it_out' });
    const a = chooseMosjeAction(s, 'player_1', 0);
    expect(a).toMatchObject({ kind: 'quest', stackId: 'FIGHTING' });
    expect(rollQuestAttempt(s, 'player_1', { slotIndex: 0, stackId: a.stackId, costChoice: a.costChoice, rng: () => 0.9 }).ok).toBe(true);
  });

  it('skips a Quest whose failure would getemt it at even odds', () => {
    const s = board(mkSlot({ mp: 15 }), [null, null], { FIGHTING: 'quest_tough_it_out' });
    expect(chooseMosjeAction(s, 'player_1', 0)).toBeNull();
  });

  it('skips a Quest whose "First you must" cost it cannot pay', () => {
    const s = board(mkSlot({ mp: 60 }), [null, null], { FIGHTING: 'quest_endurance_test' });
    s.players.player_1.hand = [];
    expect(chooseMosjeAction(s, 'player_1', 0)).toBeNull();
  });
});

describe('chooseQuestChoices', () => {
  it('jabs the lowest-MP legal target on a win (fresh Mosjes excluded)', () => {
    const s = board(mkSlot({ mp: 60 }), [mkSlot({ mp: 70 }), mkSlot({ mp: 20 })]);
    s.players.player_2.activeSlots.push(mkSlot({ mp: 5, entryProtected: true }));
    const c = chooseQuestChoices(s, 'player_1', { questId: 'quest_dutch_courage', win: true, discardedCardIds: [] });
    expect(c.jabTarget).toEqual({ playerId: 'player_2', slotIndex: 1 });
  });

  it('uses Vraag Aad on a fail when it holds a card, not when the hand is empty', () => {
    const s = board(mkSlot({ mp: 60 }), [null, null], {}, { hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }] });
    const pending = { questId: 'quest_geen_raad_vraag_aad', win: false, discardedCardIds: [] };
    expect(chooseQuestChoices(s, 'player_1', pending).vraagAadDiscardHandIndex).toBe(0);
    s.players.player_1.hand = [];
    expect(chooseQuestChoices(s, 'player_1', pending).vraagAadDiscardHandIndex).toBeUndefined();
  });

  it('Parkeren Delft removes up to 3 of the opponent discards', () => {
    const s = board(mkSlot({ mp: 60 }), [null, null]);
    s.players.player_2.graveyard = [1, 2, 3, 4].map(n => ({ cardId: 'piecie_kannetje_melk', n }));
    const c = chooseQuestChoices(s, 'player_1', { questId: 'quest_parkeren_delft', win: true, discardedCardIds: [] });
    expect(c.parkerenRemove).toHaveLength(3);
    expect(c.parkerenRemove.every((p: any) => p.playerId === 'player_2')).toBe(true);
  });
});
