// Phase 70-04 (D-17..D-19): Attach cards move onto a Mosje, max 2 (Jeffrey 3), replace, leave with the Mosje, count as ready gear.
import { describe, expect, it } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie, resolvePiecieActivation } from '../../src/engine/turnManager.js';
// @ts-ignore
import { activatePiecieFree } from '../../src/engine/table/activatePiecieFree.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { settleMosjePauses } from '../../src/bot/settleMosjePauses.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { applyGainToSlot } from '../../src/engine/mp/applyGainToSlot.js';
// @ts-ignore
import { applyGetemt } from '../../src/engine/mp/applyGetemt.js';
// @ts-ignore
import { markMosjeDefeated } from '../../src/engine/victoryChecker.js';
// @ts-ignore
import { returnMosjeToHand } from '../../src/engine/gameState.js';
// @ts-ignore
import { callMosjeBackToWelloe } from '../../src/engine/table/callMosjeBackToWelloe.js';
// @ts-ignore
import { getMaxAttachments } from '../../src/engine/attachments/getMaxAttachments.js';
// @ts-ignore
import { attachToMosje } from '../../src/engine/attachments/attachToMosje.js';
// @ts-ignore
import { dropAttachments } from '../../src/engine/attachments/dropAttachments.js';
// @ts-ignore
import { getReadyPiecies } from '../../src/engine/attachments/getReadyPiecies.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const defOf = (id: string) => MOSJES.find((m: any) => m.id === id);
const second = () => { const s = createMosjeSlot(MOSJES.find((m: any) => m.id !== 'mosje_gandoe_wizard' && m.id !== 'mosje_jeffrey'), { level: 1, mp: 50 }); s.entryProtected = false; return s; };
const att = (cardId: string, attachedTurn = 1) => ({ cardId, attachedTurn });
const pileIds = (s: any, pid = 'player_1') => (s.players[pid].graveyard || []).map((e: any) => e.cardId);

function board(piecieId = 'piecie_dumbbells', { two = false, preloaded = [] as string[] } = {}) {
  const s = makePiecieState({ piecieId });
  s.players.player_1.energy = 6;
  if (two) s.players.player_1.activeSlots[1] = second();
  s.players.player_1.activeSlots[0].attachments = preloaded.map((c) => att(c));
  return s;
}

describe('attachment rules', () => {
  it('every new slot has an empty attachments list', () => {
    expect(createMosjeSlot(defOf('mosje_gandoe_wizard')).attachments).toEqual([]);
  });
  it('max is 2, Jeffrey 3', () => {
    expect(getMaxAttachments({ cardId: 'mosje_gandoe_wizard' })).toBe(2);
    expect(getMaxAttachments({ cardId: 'mosje_jeffrey' })).toBe(3);
  });
  it('attachToMosje adds, replaces at replaceIndex into the pile, and refuses a full slot without a valid index', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal', 'piecie_koksmes'] });
    const refused = attachToMosje(s, 'player_1', 0, 'piecie_dumbbells', {});
    expect(refused.ok).toBe(false);
    expect(s.players.player_1.activeSlots[0].attachments).toHaveLength(2);
    expect(attachToMosje(s, 'player_1', 0, 'piecie_dumbbells', { replaceIndex: 5 }).ok).toBe(false);
    const ok = attachToMosje(s, 'player_1', 0, 'piecie_dumbbells', { replaceIndex: 0 });
    expect(ok.ok).toBe(true);
    expect(s.players.player_1.activeSlots[0].attachments.map((a: any) => a.cardId)).toEqual(['piecie_koksmes', 'piecie_dumbbells']);
    expect(pileIds(s)).toEqual(['piecie_rugbybal']);
    const open = board();
    expect(attachToMosje(open, 'player_1', 0, 'piecie_dumbbells', {}).ok).toBe(true);
    expect(open.players.player_1.activeSlots[0].attachments[0]).toEqual({ cardId: 'piecie_dumbbells', attachedTurn: 5 });
    expect(attachToMosje(open, 'player_1', 1, 'piecie_dumbbells', {}).ok).toBe(false); // empty slot
  });
  it('dropAttachments puts every attachment in the pile', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal', 'piecie_koksmes'] });
    dropAttachments(s.players.player_1, s.players.player_1.activeSlots[0]);
    expect(s.players.player_1.activeSlots[0].attachments).toEqual([]);
    expect(pileIds(s).sort()).toEqual(['piecie_koksmes', 'piecie_rugbybal']);
  });
  it('attachments stay through level-ups and level-downs', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal'] });
    const slot = s.players.player_1.activeSlots[0];
    applyGainToSlot(slot, 100, { turnNumber: 5 });
    expect(slot.level).toBe(2);
    expect(slot.attachments).toHaveLength(1);
    slot.mp = 0;
    applyGetemt(slot);
    expect(slot.level).toBe(1);
    expect(slot.attachments).toHaveLength(1);
  });
});

describe('getReadyPiecies', () => {
  it('lists ready gear in slots and attached gear', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal'] });
    s.players.player_1.piecieSlots[1] = { cardId: 'piecie_kannetje_melk', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
    const gear = getReadyPiecies(s, 'player_1', { tag: 'gear' });
    expect(gear).toEqual([
      { zone: 'slot', slotIndex: 0, cardId: 'piecie_dumbbells' },
      { zone: 'attached', mosjeSlotIndex: 0, attachIndex: 0, cardId: 'piecie_rugbybal' },
    ]);
    expect(getReadyPiecies(s, 'player_1', { name: 'piecie_rugbybal' })).toHaveLength(1);
  });
  it('a Piecie placed this turn is not ready, an attachment always counts', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal'] });
    s.players.player_1.piecieSlots[0].canActivateOnTurn = 6; // turnNumber is 5
    const gear = getReadyPiecies(s, 'player_1', { tag: 'gear' });
    expect(gear.map((g: any) => g.zone)).toEqual(['attached']);
  });
});

describe('activating an Attach card', () => {
  it('one Mosje: pays Energy, attaches, frees the slot, nothing in the pile', () => {
    const s = board();
    const r = activatePiecie(s, 'player_1', 0);
    expect(r.success).toBe(true);
    const p = r.state.players.player_1;
    expect(p.activeSlots[0].attachments.map((a: any) => a.cardId)).toEqual(['piecie_dumbbells']);
    expect(p.piecieSlots[0]).toBeNull();
    expect(pileIds(r.state)).toEqual([]);
    expect(p.piecieActivationsThisTurn).toBe(1);
  });
  it('two Mosjes: pauses on an ownMosje choice and attaches to the pick', () => {
    const r = activatePiecie(board('piecie_dumbbells', { two: true }), 'player_1', 0);
    expect(r.paused).toBe(true);
    const pc = r.state.pendingChoice;
    expect(pc.choiceKind).toBe('ownMosje');
    expect(pc.options).toHaveLength(2);
    expect(resolvePendingChoice(r.state, { label: 'x', slotIndex: 9 }).ok).toBe(false);
    const done = resolvePendingChoice(r.state, pc.options[1]);
    expect(done.ok).toBe(true);
    const p = done.state.players.player_1;
    expect(p.activeSlots[0].attachments).toEqual([]);
    expect(p.activeSlots[1].attachments.map((a: any) => a.cardId)).toEqual(['piecie_dumbbells']);
    expect(p.piecieSlots[0]).toBeNull();
    expect(pileIds(done.state)).toEqual([]);
  });
  it('a full Mosje asks what to replace; the replaced card goes to the pile', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal', 'piecie_koksmes'] });
    const r = activatePiecie(s, 'player_1', 0);
    expect(r.paused).toBe(true);
    const pc = r.state.pendingChoice;
    expect(pc.key).toBe('attach_replace');
    expect(pc.options.map((o: any) => o.attachIndex)).toEqual([0, 1]);
    expect(r.state.players.player_1.piecieSlots[0]).toBeTruthy(); // nothing changed before the answer
    const done = resolvePendingChoice(r.state, pc.options[1]);
    const p = done.state.players.player_1;
    expect(p.activeSlots[0].attachments.map((a: any) => a.cardId)).toEqual(['piecie_rugbybal', 'piecie_dumbbells']);
    expect(pileIds(done.state)).toEqual(['piecie_koksmes']);
    expect(p.piecieSlots[0]).toBeNull();
  });
  it('Jeffrey takes a third without a question and asks at the fourth', () => {
    const s = makePiecieState({ piecieId: 'piecie_rugbybal' });
    const j = createMosjeSlot(defOf('mosje_jeffrey'), { level: 1, mp: 50 });
    j.entryProtected = false;
    j.attachments = [att('piecie_rugbybal'), att('piecie_koksmes')];
    s.players.player_1.activeSlots = [j, null];
    const r = activatePiecie(s, 'player_1', 0);
    expect(r.success).toBe(true);
    expect(r.paused).toBeFalsy();
    expect(r.state.players.player_1.activeSlots[0].attachments).toHaveLength(3);
    const again = r.state;
    again.players.player_1.piecieSlots[0] = { cardId: 'piecie_hawaiishirt', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
    const r4 = activatePiecie(again, 'player_1', 0);
    expect(r4.paused).toBe(true);
    expect(r4.state.pendingChoice.key).toBe('attach_replace');
  });
  it('the bot answers: first Mosje, and the oldest attachment when full', () => {
    const r = activatePiecie(board('piecie_dumbbells', { two: true, preloaded: ['piecie_rugbybal', 'piecie_koksmes'] }), 'player_1', 0);
    const settled = settleMosjePauses(r.state, []);
    expect(settled.waiting).toBe(false);
    const p = settled.state.players.player_1;
    expect(p.activeSlots[0].attachments.map((a: any) => a.cardId)).toEqual(['piecie_koksmes', 'piecie_dumbbells']);
    expect(pileIds(settled.state)).toEqual(['piecie_rugbybal']);
  });
  it('is refused before Energy is paid when there is no Mosje to attach to', () => {
    const s = board();
    s.players.player_1.activeSlots = [null, null];
    s.players.player_1.piecieSlots[0].cardId = 'piecie_rugbybal'; // costs 2
    const r = activatePiecie(s, 'player_1', 0);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.energy).toBe(6);
    expect(r.state.players.player_1.piecieSlots[0]).toBeTruthy();
  });
  it('a cancelled activation (Jensen!) discards the card without attaching', () => {
    const s = board();
    s.replayingHeld = true;
    s.reactionMods = [{ kind: 'cancel', playerId: 'player_1', slotIndex: null, dest: 'discard' }];
    const r = resolvePiecieActivation(s, 'player_1', 0, { id: 'piecie_dumbbells', name: 'Dumbbells', effectId: 'effect_dumbbells', attach: true, type: 'PIECIE', cost: 0, tags: [] }, { free: false });
    expect(r.negated).toBe(true);
    expect(r.state.players.player_1.activeSlots[0].attachments || []).toEqual([]);
    expect(pileIds(r.state)).toEqual(['piecie_dumbbells']);
  });
  it('a free activation from the hand ends attached, in no other zone', () => {
    const s = board();
    s.players.player_1.piecieSlots[0] = null;
    s.players.player_1.hand = [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }];
    const r = activatePiecieFree(s, 'player_1', { card: 'piecie_dumbbells', from: 'hand' });
    expect(r.success).toBe(true);
    const p = r.state.players.player_1;
    expect(p.activeSlots[0].attachments.map((a: any) => a.cardId)).toEqual(['piecie_dumbbells']);
    expect(p.hand).toEqual([]);
    expect(p.deck).toEqual([]);
    expect(pileIds(r.state)).toEqual([]);
  });
  it('the slot freed by attaching takes a new Piecie in the same turn', () => {
    const r = activatePiecie(board(), 'player_1', 0);
    const slots = r.state.players.player_1.piecieSlots;
    expect(slots.filter((x: any) => x === null).length).toBe(slots.length);
  });
});

describe('attachments leave with the Mosje', () => {
  it('defeated: both cards in the pile', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal', 'piecie_koksmes'] });
    s.players.player_1.activeSlots[0].sideways = true;
    const out = markMosjeDefeated(s, 'player_1', 0);
    expect(out.players.player_1.activeSlots[0]).toBeNull();
    expect(pileIds(out)).toEqual(expect.arrayContaining(['piecie_rugbybal', 'piecie_koksmes']));
    const entry = out.players.player_1.graveyard.find((e: any) => e.type === 'MOSJE');
    expect(entry.attachments).toBeUndefined();
  });
  it('returned to the hand: both cards in the pile, none travels with the Mosje', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal', 'piecie_koksmes'] });
    const out = returnMosjeToHand(s, 'player_1', 0);
    expect(pileIds(out).sort()).toEqual(['piecie_koksmes', 'piecie_rugbybal']);
    const card = out.players.player_1.hand[0];
    expect(JSON.stringify(card)).not.toContain('attach');
  });
  it('called back to the Welloes: both cards in the pile', () => {
    const s = board('piecie_dumbbells', { preloaded: ['piecie_rugbybal', 'piecie_koksmes'] });
    s.players.player_1.activeSlots[0].summonedByPiecie = 'piecie_call_of_welloes';
    const out = callMosjeBackToWelloe(s, 'player_1', { cardId: 'piecie_call_of_welloes', linkedMosjeCardId: s.players.player_1.activeSlots[0].cardId });
    expect(out.players.player_1.activeSlots[0]).toBeNull();
    expect(pileIds(out)).toEqual(expect.arrayContaining(['piecie_rugbybal', 'piecie_koksmes']));
  });
});
