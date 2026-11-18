// Phase 59-04: the last 8 Example-Deck Piecies (Utility draw / dice / chain / Place), numbers from the Card List 2.0.
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
// @ts-ignore
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
// @ts-ignore
import { resolveQuestAttempt } from '../../src/engine/quests/resolveQuestAttempt.js';
// @ts-ignore
import { getEligibleReactions } from '../../src/engine/reactions/getEligibleReactions.js';
// @ts-ignore
import { getQuestDef } from '../../src/engine/quests/getQuestDef.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';

afterEach(() => vi.restoreAllMocks());

const cards = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: 'PIECIE' }));
const filler = (n: number) => cards(...Array.from({ length: n }, () => 'piecie_pot_of_weed'));
const slotOf = (id: string, mp = 50) => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
  s.entryProtected = false;
  return s;
};
function board(piecieId: string, o: any = {}) {
  const s: any = makePiecieState({ piecieId });
  const me = s.players.player_1;
  const foe = s.players.player_2;
  me.energy = o.energy ?? 6;
  me.deck = o.deck ?? filler(6);
  me.hand = o.hand ?? [];
  foe.hand = o.foeHand ?? [];
  foe.graveyard = o.foeGrave ?? [];
  if (o.second) me.activeSlots[1] = o.second;
  if (o.own) me.activeSlots[0] = o.own;
  if (o.place) {
    s.activePlace = o.place;
    s.activePlacePlayedBy = o.placeBy ?? 'player_2';
  }
  s._pendingTargets = o.pick || {};
  return s;
}
const run = (s: any) => {
  const r = activatePiecie(s, 'player_1', 0);
  expect(r.success, r.error).toBe(true);
  return r.state;
};
const answer = (s: any, pick: (options: any[]) => any) => {
  const r = resolvePendingChoice(s, pick(s.pendingChoice.options));
  expect(r.ok).toBe(true);
  return r.state;
};
const mp = (s: any, i = 0) => s.players.player_1.activeSlots[i].mp;
const ids = (list: any[]) => list.map((c) => c.cardId);

describe('Boosterpackkie', () => {
  it('draws 1 and nothing more without a Coert (no roll)', () => {
    const random = vi.spyOn(Math, 'random');
    const s = run(board('piecie_boosterpackkie'));
    expect(s.players.player_1.hand).toHaveLength(1);
    expect(s.players.player_1.cardsDrawnThisTurn).toBe(1);
    expect(mp(s)).toBe(50);
    expect(random).not.toHaveBeenCalled();
  });
  it('with a Coert: no MP (2.1), a 5-6 draws 1 more, a 1-4 does not', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const hi = run(board('piecie_boosterpackkie', { second: slotOf('mosje_coert_kasteluck', 40) }));
    expect(hi.players.player_1.hand).toHaveLength(2);
    expect(mp(hi, 1)).toBe(40);
    expect(mp(hi, 0)).toBe(50);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const lo = run(board('piecie_boosterpackkie', { second: slotOf('mosje_coert_kasteluck', 40) }));
    expect(lo.players.player_1.hand).toHaveLength(1);
    expect(mp(lo, 1)).toBe(40);
  });
});

describe('Zie je die Dingetjes', () => {
  const A = 'piecie_pot_of_weed', B = 'piecie_keyboard', C = 'piecie_mouse';
  it('top 3: one to hand, the rest back in the chosen order', () => {
    let s = run(board('piecie_zie_je_die_dingetjes', { deck: cards(A, B, C, 'piecie_tikker') }));
    expect(s.pendingChoice.playerId).toBe('player_1');
    expect(s.pendingChoice.options.map((o: any) => o.cardId)).toEqual([A, B, C]);
    s = answer(s, (o) => o.find((x: any) => x.cardId === B));
    expect(s.pendingChoice.options.map((o: any) => o.cardId)).toEqual([A, C]);
    s = answer(s, (o) => o.find((x: any) => x.cardId === C));
    expect(s.pendingChoice).toBeUndefined();
    expect(ids(s.players.player_1.hand)).toEqual([B]);
    expect(ids(s.players.player_1.deck).slice(0, 3)).toEqual([C, A, 'piecie_tikker']);
    expect(s.players.player_1.cardsDrawnThisTurn || 0).toBe(0);
  });
  it('with 2 cards left looks at 2; with 1 takes it; with 0 nothing', () => {
    let s = run(board('piecie_zie_je_die_dingetjes', { deck: cards(A, B) }));
    expect(s.pendingChoice.options).toHaveLength(2);
    s = answer(s, (o) => o[0]);
    expect(ids(s.players.player_1.hand)).toEqual([A]);
    expect(ids(s.players.player_1.deck)).toEqual([B]);
    const one = run(board('piecie_zie_je_die_dingetjes', { deck: cards(A) }));
    expect(ids(one.players.player_1.hand)).toEqual([A]);
    expect(one.pendingChoice).toBeUndefined();
    const none = run(board('piecie_zie_je_die_dingetjes', { deck: [] }));
    expect(none.players.player_1.hand).toHaveLength(0);
    expect(none.pendingChoice).toBeUndefined();
  });
});

describe('Stookerino', () => {
  // 2.1: the OPPONENT picks the card they discard; no MP for anyone; with a Binti on your field you look at the hand first.
  const stook = (foeHand: string[], o: any = {}) => {
    let s = run(board('piecie_stookerino', { foeHand: cards(...foeHand), ...o }));
    if (s.pendingChoice) s = answer(s, (opts) => opts[0]);
    return s;
  };
  it('the card goes to the opponent discard pile, nobody gains MP', () => {
    const two = stook(['piecie_chain_reaction', 'piecie_harde_didde']);
    expect(mp(two)).toBe(50);
    expect(ids(two.players.player_2.hand)).toEqual(['piecie_harde_didde']);
    expect(ids(two.players.player_2.graveyard)).toEqual(['piecie_chain_reaction']);
  });
  it('the opponent picks which card; an empty hand does nothing', () => {
    let s = run(board('piecie_stookerino', { foeHand: cards('piecie_pot_of_weed', 'piecie_harde_didde') }));
    expect(s.pendingChoice.playerId).toBe('player_2');
    expect(s.pendingChoice.options).toHaveLength(2);
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_harde_didde'));
    expect(mp(s)).toBe(50);
    expect(ids(s.players.player_2.graveyard)).toEqual(['piecie_harde_didde']);
    const empty = run(board('piecie_stookerino', { foeHand: [] }));
    expect(mp(empty)).toBe(50);
    expect(empty.pendingChoice).toBeUndefined();
  });
  it('a Binti on your field: no MP either, the hand is revealed to you', () => {
    const s = run(board('piecie_stookerino', { foeHand: cards('piecie_chain_reaction', 'piecie_harde_didde'), second: slotOf('mosje_binti', 30) }));
    expect(s.pendingChoice.playerId).toBe('player_2');
    expect(s.revealed.player_1[0].cardIds).toEqual(['piecie_chain_reaction', 'piecie_harde_didde']);
    expect(mp(s, 1)).toBe(30);
  });
});

describe('Dikke Plaat reroll pause (Dubbele Dosis no longer grants a reroll, 71-09)', () => {
  const q = getQuestDef('quest_tough_it_out');
  function withQuest(s: any) {
    const stacks: any = {};
    for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) stacks[id] = { deck: ['quest_filler'], faceUp: 'quest_filler', tokens: 0, discard: [] };
    stacks[q.stack] = { deck: ['quest_filler'], faceUp: q.id, tokens: 0, discard: [] };
    s.questStacks = stacks;
    s.players.player_1.activeSlots[0].traits = { strength: 1, mental: 1, artistic: 1, technical: 1, resilient: 1, social: 1 };
    return s;
  }
  const opts = { slotIndex: 0, stackId: q.stack };

  it('+1 die on the next Quest and one reroll at its own after-roll pause', () => {
    const s = run(withQuest(board('piecie_dikke_plaat', { own: slotOf('mosje_alyssa_fissa') })));
    expect(s.players.player_1.questExtraDice).toBe(1);
    expect(s.players.player_1.rerollGrants).toHaveLength(1);
    const w = rollQuestAttempt(s, 'player_1', { ...opts, rng: () => 0.7, skipBeforeRoll: true });
    expect(w.state.pendingReaction.moments).toEqual(['afterOwnQuestRoll']);
    expect(w.state.pendingQuestRoll.dice).toHaveLength(2);
    expect(w.state.pendingReaction.eligible).toEqual(['piecieReroll:0', 'piecieReroll:1']);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const r = resolveReaction(w.state, 'player_1', 'piecieReroll:1');
    expect(r.ok).toBe(true);
    expect(r.state.players.player_1.rerollGrants || []).toHaveLength(0);
    expect(r.state.pendingQuestRoll.dice).toEqual([5, 1]);
    expect(getEligibleReactions(r.state, 'player_1', ['afterOwnQuestRoll'], { dice: [5, 1] })).toEqual([]);
    expect(resolveQuestAttempt(r.state, undefined as any).ok).toBe(true);
  });
  it("the opponent's roll never offers the reroll; an unused grant ends with the turn or with that Quest", () => {
    const s = run(withQuest(board('piecie_dikke_plaat', { own: slotOf('mosje_alyssa_fissa') })));
    expect(getEligibleReactions(s, 'player_1', ['afterQuestRoll'], { dice: [3] })).toEqual([]);
    expect(getEligibleReactions(s, 'player_1', ['afterOwnQuestRoll'], { dice: [3] })).toEqual(['piecieReroll:0']);
    expect(endTurn(s).players.player_1.rerollGrants).toBeUndefined();
    const done = rollQuestAttempt(s, 'player_1', { ...opts, rng: () => 0.7, skipReactions: true });
    const after = resolveQuestAttempt(done.state, done.pending);
    expect(after.state.players.player_1.rerollGrants).toEqual([]);
  });
  it('never more than 6 dice', () => {
    const s = withQuest(board('piecie_dikke_plaat', { own: slotOf('mosje_alyssa_fissa') }));
    s.players.player_1.questExtraDice = 5;
    const done = rollQuestAttempt(run(s), 'player_1', { ...opts, rng: () => 0.7, skipReactions: true });
    expect(done.pending.dice.length).toBe(6); // cap is 6 since 70-02
  });
});

describe('Chain Reaction', () => {
  function chainBoard() {
    const s = board('piecie_chain_reaction');
    const ready = (cardId: string) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 });
    s.players.player_1.piecieSlots[1] = ready('piecie_quest_prep');
    s.players.player_1.piecieSlots[2] = ready('piecie_slecht_gezet');
    return s;
  }
  const act = (s: any, i: number) => {
    const r = activatePiecie(s, 'player_1', i);
    expect(r.success, r.error).toBe(true);
    return r.state;
  };
  it('after a paid Piecie the next ready Piecie is free, once; Chain Reaction itself does not trigger it', () => {
    let s = act(chainBoard(), 0);
    expect(s.players.player_1.energy).toBe(4);
    expect(s.players.player_1.chainReactionOffer || 0).toBe(0);
    s = act(s, 1); // paid: 1 Energy, then the offer stands
    expect(s.players.player_1.energy).toBe(3);
    expect(s.players.player_1.chainReactionOffer).toBe(1);
    s = act(s, 2); // free
    expect(s.players.player_1.energy).toBe(3);
    expect(s.players.player_1.chainReactionOffer).toBe(0);
  });
  it('an unused offer ends with the turn', () => {
    const s = endTurn(act(act(chainBoard(), 0), 1));
    expect(s.players.player_1.chainReactionOffer).toBe(0);
    expect(s.players.player_1.chainReactionFree).toBe(0);
  });
});

describe('Place Piecies', () => {
  it('Slecht Gezet: your own Place goes back to your hand, the opponent Place is destroyed, no Place = nothing', () => {
    const own = run(board('piecie_slecht_gezet', { place: 'place_the_gym', placeBy: 'player_1' }));
    expect(own.activePlace).toBeNull();
    expect(own.players.player_1.hand).toContainEqual({ cardId: 'place_the_gym', type: 'PLACE' });
    expect(own.players.player_1.graveyard.some((c: any) => c.cardId === 'place_the_gym')).toBe(false);
    const foe = run(board('piecie_slecht_gezet', { place: 'place_the_gym', placeBy: 'player_2' }));
    expect(foe.activePlace).toBeNull();
    expect(foe.players.player_1.hand).toHaveLength(0);
    expect(foe.players.player_2.graveyard.some((c: any) => c.cardId === 'place_the_gym')).toBe(true);
    expect(run(board('piecie_slecht_gezet')).players.player_1.hand).toHaveLength(0);
  });
  it('Shhh, popo komt! is refused under 3 Mosjes, and destroys the Place with 3+', () => {
    const two = activatePiecie(board('piecie_popo_komt', { place: 'place_the_gym' }), 'player_1', 0);
    expect(two.success).toBe(false);
    const three = run(board('piecie_popo_komt', { place: 'place_the_gym', second: slotOf('mosje_binti') }));
    expect(three.activePlace).toBeNull();
    expect(three.players.player_2.graveyard.some((c: any) => c.cardId === 'place_the_gym')).toBe(true);
  });
  describe('Huisbaas', () => {
    const substance = PIECIES.find((p: any) => p.tag === 'substance').id;
    const withDeck = (o: any = {}) => board('piecie_huisbaas', {
      place: 'place_the_gym', foeGrave: cards(substance), deck: [...cards('piecie_pot_of_weed'), { cardId: 'place_arcade', type: 'PLACE' }, ...filler(2)], ...o,
    });
    it('is refused without a substance Piecie on top of a discard pile', () => {
      expect(activatePiecie(withDeck({ foeGrave: cards('piecie_keyboard') }), 'player_1', 0).success).toBe(false);
    });
    it('destroys the Place, then plays a Place from the deck paying its cost; the deck is shuffled', () => {
      let s = run(withDeck());
      expect(s.activePlace).toBeNull();
      expect(s.pendingChoice.options.map((o: any) => o.cardId ?? 'none')).toEqual(['place_arcade', 'none']);
      s = answer(s, (o) => o[0]);
      expect(s.activePlace).toBe('place_arcade');
      expect(s.activePlacePlayedBy).toBe('player_1');
      expect(s.players.player_1.energy).toBe(2); // 6 - 1 (Huisbaas) - 3 (Arcade)
      expect(s.players.player_1.deck.some((c: any) => c.cardId === 'place_arcade')).toBe(false);
      expect(s.players.player_1.hand).toHaveLength(0);
      expect(s.players.player_1.deck).toHaveLength(3);
    });
    it('"No Place" ends it; a Place you cannot pay for is not offered and stays in the deck', () => {
      let s = run(withDeck());
      s = answer(s, (o) => o.find((x: any) => x.none));
      expect(s.activePlace).toBeNull();
      expect(s.players.player_1.deck.some((c: any) => c.cardId === 'place_arcade')).toBe(true);
      const poor = run(withDeck({ energy: 3 })); // 3 - 1 = 2 left: Arcade (3) is too dear
      expect(poor.pendingChoice).toBeUndefined();
      expect(poor.players.player_1.deck.some((c: any) => c.cardId === 'place_arcade')).toBe(true);
    });
  });
});
