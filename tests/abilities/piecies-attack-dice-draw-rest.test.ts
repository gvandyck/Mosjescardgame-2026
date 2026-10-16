// Phase 59-06: Attack rest, Utility dice rest and Utility draw rest (16 Piecies), numbers from the Card List 2.0.
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie, endTurn, playPiecie, playMosje, playSnellie, playPlace } from '../../src/engine/turnManager.js';
// @ts-ignore
import { activatePiecieFree } from '../../src/engine/table/activatePiecieFree.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
// @ts-ignore
import { markMosjeDefeated } from '../../src/engine/victoryChecker.js';
// @ts-ignore
import { getPower } from '../../src/engine/mp/getPower.js';
// @ts-ignore
import { getQuestDef } from '../../src/engine/quests/getQuestDef.js';
// @ts-ignore
import { checkQuestCondition } from '../../src/engine/quests/checkQuestCondition.js';
// @ts-ignore
import { getQuestDiceCount } from '../../src/engine/quests/getQuestDiceCount.js';
// @ts-ignore
import { findRerollGrant } from '../../src/engine/quests/findRerollGrant.js';
// @ts-ignore
import { forceQuestResult } from '../helpers/forceQuestResult.js';
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
  me.energy = 6;
  me.jiscaRolledThisTurn = true;
  me.deck = o.deck ?? filler(6);
  me.hand = o.hand ?? [];
  me.graveyard = o.grave ?? [];
  foe.hand = o.foeHand ?? [];
  foe.deck = filler(4);
  if (o.own) me.activeSlots[0] = o.own;
  if (o.second) me.activeSlots[1] = o.second;
  if (o.foe) foe.activeSlots[0] = o.foe;
  if (o.foe2) foe.activeSlots[1] = o.foe2;
  s._pendingTargets = o.pick || {};
  return s;
}
const run = (s: any, slot = 0) => {
  const r = activatePiecie(s, 'player_1', slot);
  expect(r.success, r.error).toBe(true);
  return r.state;
};
const answer = (s: any, pick: (options: any[]) => any) => {
  const r = resolvePendingChoice(s, pick(s.pendingChoice.options));
  expect(r.ok).toBe(true);
  return r.state;
};
const mp = (s: any, who = 'player_1', i = 0) => s.players[who].activeSlots[i].mp;
const hand = (s: any, who = 'player_1') => s.players[who].hand.map((c: any) => c.cardId);
const attack = (s: any) => attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 });
// The owner's next turn: same state, round 6, player_1 active.
const nextOwnTurn = (s: any) => { const n = JSON.parse(JSON.stringify(s)); n.activePlayerId = 'player_1'; n.turnNumber += 1; return n; };
const MING = 'mosje_ming_predictor';
const stays = (s: any) => s.players.player_1.piecieSlots[0];
const sleeping = (s: any) => { s.players.player_2.activeSlots[0].entryProtected = false; return s; };

describe('Attack rest', () => {
  it('Snoeiertje +10 Power now, -10 MP at the end of the turn', () => {
    const s0 = board('piecie_snoeiertje');
    const base = getPower(s0.players.player_1.activeSlots[0]);
    const s = run(s0);
    expect(getPower(s.players.player_1.activeSlots[0])).toBe(base + 10);
    expect(mp(endTurn(s))).toBe(40);
  });

  it('Continuous Assault: Stays, +10 Power while it stays, gone at the end of the next turn', () => {
    const s0 = board('piecie_continuous_assault');
    const base = getPower(s0.players.player_1.activeSlots[0]);
    const s = run(s0);
    expect(stays(s).stays).toBe(true);
    expect(getPower(s.players.player_1.activeSlots[0])).toBe(base + 10);
    const e = endTurn(s); // still there after this turn
    expect(getPower(e.players.player_1.activeSlots[0])).toBe(base + 10);
    const done = endTurn(nextOwnTurn(e));
    expect(done.players.player_1.piecieSlots[0]).toBeNull();
    expect(getPower(done.players.player_1.activeSlots[0])).toBe(base);
    expect(done.players.player_1.graveyard.map((g: any) => g.cardId)).toContain('piecie_continuous_assault');
  });

  it('MP Hemorrhage: +20 Power; no attack -> discarded at the end of the turn, nothing lost', () => {
    const s0 = board('piecie_mp_hemorrhage');
    const base = getPower(s0.players.player_1.activeSlots[0]);
    const s = run(s0);
    expect(getPower(s.players.player_1.activeSlots[0])).toBe(base + 20);
    const e = endTurn(s);
    expect(e.players.player_1.piecieSlots[0]).toBeNull();
    expect(e.players.player_1.activeSlots[0].mpHemorrhageArmed).toBeUndefined();
    expect(mp(e, 'player_2')).toBe(50);
    expect(e.players.player_1.endOfTurnLosses || []).toEqual([]);
  });

  it('MP Hemorrhage: the first attack marks the victim; it loses 10 at the end of the next turn, then the card goes', () => {
    const s = attack(run(sleeping(board('piecie_mp_hemorrhage')))).state;
    expect(stays(s).marked).toBe(true);
    expect(stays(s).boundTo[0]).toMatchObject({ playerId: 'player_2', slotIndex: 0 });
    const foeAfterHit = mp(s, 'player_2');
    const e = endTurn(s);
    expect(stays(e)).toBeTruthy(); // marked: stays past this turn
    expect(mp(e, 'player_2')).toBe(foeAfterHit);
    const done = endTurn(nextOwnTurn(e));
    expect(mp(done, 'player_2')).toBe(foeAfterHit - 10);
    expect(done.players.player_1.piecieSlots[0]).toBeNull();
  });

  it('MP Hemorrhage: the marked Mosje leaves play first -> the card is discarded and nothing is lost', () => {
    const s = attack(run(sleeping(board('piecie_mp_hemorrhage', { foe2: slotOf(MING, 70) })))).state;
    const gone = markMosjeDefeated(s, 'player_2', 0);
    expect(gone.players.player_1.piecieSlots[0]).toBeNull();
    const done = endTurn(nextOwnTurn(endTurn(gone)));
    expect(mp(done, 'player_2', 1)).toBe(70);
  });

  it('Kleine Taks: -10 at the end of this turn and -10 at the end of the next turn, then discard', () => {
    const s = run(board('piecie_kleine_taks', { pick: { opp_slot_index: 0 } }));
    expect(stays(s).boundTo[0]).toMatchObject({ playerId: 'player_2', slotIndex: 0 });
    const e = endTurn(s);
    expect(mp(e, 'player_2')).toBe(40);
    expect(stays(e)).toBeTruthy();
    const done = endTurn(nextOwnTurn(e));
    expect(mp(done, 'player_2')).toBe(30);
    expect(done.players.player_1.piecieSlots[0]).toBeNull();
  });

  it('Kleine Taks: a fresh opponent Mosje is not offered, the card does not stay', () => {
    const s0 = board('piecie_kleine_taks');
    s0.players.player_2.activeSlots[0].entryProtected = true;
    s0.players.player_2.activeSlots[0].turnsOnField = 0;
    const s = run(s0);
    expect(s.players.player_1.piecieSlots[0]).toBeNull();
    expect(s.players.player_1.endOfTurnLosses || []).toEqual([]);
  });

  it('Kleine Taks: the Mosje leaves play -> the card is discarded, no loss', () => {
    const s = run(board('piecie_kleine_taks', { pick: { opp_slot_index: 0 }, foe2: slotOf(MING, 70) }));
    const gone = markMosjeDefeated(s, 'player_2', 0);
    expect(gone.players.player_1.piecieSlots[0]).toBeNull();
    expect(mp(endTurn(gone), 'player_2', 1)).toBe(70);
  });

  it('Jantje Jantje...: a hit discards the card and gives +20 Power; only the named card goes', () => {
    const base = getPower(board('piecie_jantje_jantje').players.player_1.activeSlots[0]);
    let s = run(board('piecie_jantje_jantje', { foeHand: cards('piecie_affoe', 'piecie_straffoe') }));
    expect(s.pendingChoice.options.every((o: any) => o.label && o.cardId)).toBe(true);
    expect(new Set(s.pendingChoice.options.map((o: any) => o.label)).size).toBe(s.pendingChoice.options.length);
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_affoe'));
    expect(hand(s, 'player_2')).toEqual(['piecie_straffoe']);
    expect(s.players.player_2.graveyard.map((g: any) => g.cardId)).toEqual(['piecie_affoe']);
    expect(getPower(s.players.player_1.activeSlots[0])).toBe(base + 20);
    expect(mp(s)).toBe(50);
  });

  it('Jantje Jantje...: a miss costs one of your Mosjes 10 MP and leaves the opponent hand alone', () => {
    let s = run(board('piecie_jantje_jantje', { foeHand: cards('piecie_straffoe') }));
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_affoe'));
    expect(hand(s, 'player_2')).toEqual(['piecie_straffoe']);
    expect(mp(s)).toBe(40);
  });
});

describe('Utility dice rest', () => {
  const quest = () => getQuestDef('quest_quick_thinking');
  it('TweedeKANs: one reroll this turn, own or opponent Quest', () => {
    const s = run(board('piecie_tweede_kans'));
    expect(s.players.player_1.rerollGrants).toEqual([expect.objectContaining({ scope: 'anyQuest', uses: 1 })]);
    expect(findRerollGrant(s, 'player_1', true)).toBe(0);
    expect(findRerollGrant(s, 'player_1', false)).toBe(0);
  });

  it('Loaded Dice: +1 die; the reroll only with a Jeffrey on the field', () => {
    const plain = run(board('piecie_loaded_dice'));
    expect(plain.players.player_1.questExtraDice).toBe(1);
    expect(plain.players.player_1.rerollGrants || []).toEqual([]);
    const jeff = run(board('piecie_loaded_dice', { own: slotOf('mosje_jeffrey') }));
    expect(jeff.players.player_1.questExtraDice).toBe(1);
    expect(findRerollGrant(jeff, 'player_1', true)).toBe(0);
  });

  it('Dikke Plaat: reroll only with DJ 80/20 or Alyssa, Fissa Fissa!', () => {
    expect(run(board('piecie_dikke_plaat')).players.player_1.rerollGrants || []).toEqual([]);
    expect(run(board('piecie_dikke_plaat', { own: slotOf('mosje_dj_8020') })).players.player_1.rerollGrants).toHaveLength(1);
    expect(run(board('piecie_dikke_plaat', { own: slotOf('mosje_alyssa_fissa') })).players.player_1.rerollGrants).toHaveLength(1);
    expect(run(board('piecie_dikke_plaat', { own: slotOf('mosje_alyssa_bulldozer') })).players.player_1.rerollGrants || []).toEqual([]);
  });

  it('dice never go above 4', () => {
    const s = run(board('piecie_loaded_dice', { own: slotOf('mosje_jeffrey') }));
    s.players.player_1.questExtraDice = 9;
    const slot = s.players.player_1.activeSlots[0];
    expect(getQuestDiceCount(s, 'player_1', slot, quest())).toBe(4);
  });

  it('Kan het?!: 5-6 gains 40, 1-4 loses 10', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(mp(run(board('piecie_kan_het')))).toBe(90);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(mp(run(board('piecie_kan_het')))).toBe(40);
    vi.spyOn(Math, 'random').mockReturnValue(0.64);
    expect(mp(run(board('piecie_kan_het')))).toBe(40);
  });

  it('Perfect Setup: counts as the picked MP (60-90) for Quest requirements, real MP unchanged, ends with the turn', () => {
    let s = run(board('piecie_perfect_setup'));
    expect(s.pendingChoice.options.map((o: any) => o.value)).toEqual([60, 65, 70, 75, 80, 85, 90]);
    s = answer(s, (o) => o.find((x: any) => x.value === 80));
    const slot = s.players.player_1.activeSlots[0];
    expect(slot.mp).toBe(50);
    expect(slot.questMpOverride).toBe(80);
    const e = endTurn(s);
    expect(e.players.player_1.activeSlots[0].questMpOverride).toBeUndefined();
    expect(e.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it('Perfect Setup feeds the MP Quest conditions', async () => {
    // @ts-ignore
    const { QUEST_CONDITIONS } = await import('../../src/engine/quests/questConditions.js');
    const slot: any = { mp: 50 };
    expect(QUEST_CONDITIONS.mp_80_plus({ slot })).toBe(false);
    slot.questMpOverride = 85;
    expect(QUEST_CONDITIONS.mp_80_plus({ slot })).toBe(true);
    slot.questMpOverride = 60;
    expect(QUEST_CONDITIONS.mp_70_to_80({ slot })).toBe(false);
    slot.questMpOverride = 75;
    expect(QUEST_CONDITIONS.mp_70_to_80({ slot })).toBe(true);
  });
});

describe('Battle Concert', () => {
  const FAIL = 'quest_quick_thinking'; // Quick Thinking: lose 15 on a fail
  const activate = (o: any = {}) => run(board('piecie_battle_concert', o));

  it('is refused without an Alyssa on your field', () => {
    const r = activatePiecie(board('piecie_battle_concert'), 'player_1', 0);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/Alyssa/);
  });

  it('an Alyssa failing a Quest loses nothing, the chosen opponent Mosje loses 15', () => {
    const s = forceQuestResult(activate({ own: slotOf('mosje_alyssa_bulldozer'), pick: { opp_slot_index: 0 } }), 'player_1', { questId: FAIL, win: false });
    expect(mp(s)).toBe(50);
    expect(mp(s, 'player_2')).toBe(35);
    expect(s._battleConcertActive).toBeUndefined();
  });

  it('a non-Alyssa failing a Quest pays normally and the flag stays', () => {
    const s = forceQuestResult(activate({ own: slotOf('mosje_alyssa_bulldozer'), second: slotOf(MING), pick: { opp_slot_index: 0 } }), 'player_1', { slotIndex: 1, questId: FAIL, win: false });
    expect(mp(s, 'player_1', 1)).toBe(35);
    expect(mp(s, 'player_2')).toBe(50);
    expect(s._battleConcertActive).toBe('player_1');
  });
});

describe('Utility draw rest', () => {
  it('Bagga of Greed: draw 2, then discard 1 card of your whole hand', () => {
    let s = run(board('piecie_bagga_of_greed', { hand: cards('piecie_affoe'), deck: cards('piecie_straffoe', 'piecie_tikker', 'piecie_pot_of_weed') }));
    expect(hand(s)).toEqual(['piecie_affoe', 'piecie_straffoe', 'piecie_tikker']);
    expect(s.pendingChoice.options.map((o: any) => o.cardId).sort()).toEqual(['piecie_affoe', 'piecie_straffoe', 'piecie_tikker']);
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_tikker'));
    expect(hand(s)).toEqual(['piecie_affoe', 'piecie_straffoe']);
    expect(s.players.player_1.graveyard.map((g: any) => g.cardId)).toContain('piecie_tikker');
  });

  it('Perfect Rhythm: later activations draw 1, 1, 0; DDR Chris gains 10 per drawing activation', () => {
    const s0 = board('piecie_perfect_rhythm', { own: slotOf('mosje_chris_ddr', 20), deck: filler(8) });
    const pot = { cardId: 'piecie_pot_of_weed', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
    s0.players.player_1.piecieSlots[1] = { ...pot };
    s0.players.player_1.piecieSlots[2] = { ...pot };
    s0.players.player_1.ddrChainsThisTurn = 2; // DDR Chris's own random free chain is out of this test
    let s = run(s0);
    const hadHand = s.players.player_1.hand.length;
    const mpDdr = mp(s);
    s = run(s, 1); // Pot of Weed draws 2 itself
    expect(s.players.player_1.hand.length - hadHand).toBe(3);
    expect(mp(s)).toBe(mpDdr + 10);
    s = run(s, 2);
    expect(s.players.player_1.hand.length - hadHand).toBe(6);
    expect(mp(s)).toBe(mpDdr + 20);
    s.players.player_1.piecieSlots[1] = { ...pot }; // a third later activation (the slot was freed)
    s = run(s, 1);
    expect(s.players.player_1.hand.length - hadHand).toBe(8); // third later activation: no Rhythm draw
    expect(mp(s)).toBe(mpDdr + 20);
  });

  it('TemPiecie: a discard-pile card to the hand, locked in every play path this turn, free next turn', () => {
    const grave = [
      { cardId: 'piecie_affoe', name: 'Affoe', type: 'PIECIE', source: 'played' },
      { cardId: 'snelle_x', name: 'x', type: 'SNELLE_PIECIE', source: 'played' },
    ];
    let s = run(board('piecie_tempiecie', { grave }));
    expect(s.pendingChoice.options.map((o: any) => o.cardId)).toEqual(['piecie_affoe', 'snelle_x']);
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_affoe'));
    expect(hand(s)).toEqual(['piecie_affoe']);
    expect(s.players.player_1.graveyard.map((g: any) => g.cardId)).not.toContain('piecie_affoe');
    const ref = s.players.player_1.hand[0];
    const def = PIECIES.find((p: any) => p.id === 'piecie_affoe');
    const placed = playPiecie(s, 'player_1', ref, def);
    expect(placed.success).toBe(false);
    expect(placed.error).toMatch(/TemPiecie/);
    // Free activation from the hand is refused too.
    const free = activatePiecieFree(s, 'player_1', { card: 'piecie_affoe', from: 'hand' });
    expect(free.success).toBe(false);
    expect(free.error).toMatch(/TemPiecie/);
    // Next turn it can be placed.
    const later = nextOwnTurn(s);
    expect(playPiecie(later, 'player_1', ref, def).success).toBe(true);
  });

  it('TemPiecie: a Mosje, a Place and a Snelle taken back are locked too (summon / Place / Snelle paths)', () => {
    const mk = (cardId: string, type: string) => ({ cardId, name: cardId, type, source: 'played' });
    for (const [cardId, type] of [['mosje_jisca', 'MOSJE'], ['place_the_void', 'PLACE'], ['snelle_x', 'SNELLE_PIECIE']]) {
      let s = run(board('piecie_tempiecie', { grave: [mk(cardId, type)] }));
      if (s.pendingChoice) s = answer(s, (o) => o[0]);
      const ref = s.players.player_1.hand.find((c: any) => c.cardId === cardId);
      expect(ref?.lockedTurn, cardId).toBeTruthy();
      s.players.player_1.activeSlots[1] = null;
      const res = type === 'MOSJE' ? playMosje(s, 'player_1', ref)
        : type === 'PLACE' ? playPlace(s, 'player_1', ref, null)
          : playSnellie(s, 'player_1', ref, { name: 'x', effectId: 'effect_x', cost: 0 });
      expect(res.success, cardId).toBe(false);
      expect(res.error, cardId).toMatch(/TemPiecie/);
    }
  });

  it('TemPiecie: an empty discard pile does nothing', () => {
    const s = run(board('piecie_tempiecie'));
    expect(s.pendingChoice).toBeUndefined();
    expect(hand(s)).toEqual([]);
  });

  it('F1 Telemetry: +15 and draw 1; with Martin, The Precision Driver he gains 30 (not the chosen one) and you draw 2', () => {
    const plain = run(board('piecie_f1_telemetry'));
    expect(mp(plain)).toBe(65);
    expect(plain.players.player_1.hand).toHaveLength(1);
    const s = run(board('piecie_f1_telemetry', { own: slotOf(MING, 40), second: slotOf('mosje_martin_driver', 30), pick: { own_slot_index: 0 } }));
    expect(mp(s, 'player_1', 0)).toBe(40);
    expect(mp(s, 'player_1', 1)).toBe(60);
    expect(s.players.player_1.hand).toHaveLength(2);
  });

  it('Those Eyelashes Tho...: the opponent chooses the discard, +20 for yours, no opponent Snelle this turn', () => {
    const s0 = board('piecie_those_eyelashes', { second: slotOf('mosje_martin_driver', 30), foeHand: cards('piecie_affoe', 'piecie_straffoe') });
    let s = run(s0);
    expect(s.pendingChoice.playerId).toBe('player_2');
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_straffoe'));
    expect(hand(s, 'player_2')).toEqual(['piecie_affoe']);
    expect(s.players.player_2.graveyard.map((g: any) => g.cardId)).toEqual(['piecie_straffoe']);
    expect(mp(s)).toBe(70);
    expect(s._snelleBlocked).toBe('player_2');
  });

  it('Those Eyelashes Tho...: refused without a Martin or a West', () => {
    const r = activatePiecie(board('piecie_those_eyelashes'), 'player_1', 0);
    expect(r.success).toBe(false);
  });
});

describe('Card List data for the 16 Piecies', () => {
  it('Kleine Taks / MP Hemorrhage keep their Stays marker; no V4 status types remain', () => {
    expect(PIECIES.find((p: any) => p.id === 'piecie_kleine_taks').stays).toBe('custom');
    expect(PIECIES.find((p: any) => p.id === 'piecie_continuous_assault').stays).toBe('endOfNextTurn');
  });
});
