import { describe, it, expect } from 'vitest';
// @ts-ignore plain js modules
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore
import { attachToMosje } from '../../src/engine/attachments/attachToMosje.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { getAttachmentRows } from '../../src/ui/board/getAttachmentRows.js';
// @ts-ignore
import { getAttachmentChips } from '../../src/ui/board/getAttachmentChips.js';
// @ts-ignore
import { toMosjeTileCards } from '../../src/ui/board/toMosjeTileCards.js';
// @ts-ignore
import { getCardPanelLines } from '../../src/ui/cardV1/getCardPanelLines.js';
// @ts-ignore
import { buildAttachmentSection } from '../../src/ui/modals/buildAttachmentSection.js';

function stateWith(cardId: string) {
  const def = MOSJES.find((m: any) => m.id === cardId);
  const state = makeEngineState();
  state.players.player_1.activeSlots = [createMosjeSlot(def, { level: 1, mp: 10 }), null];
  return state;
}

describe('getAttachmentRows', () => {
  it('empty slot: no rows, max 2', () => {
    expect(getAttachmentRows({ cardId: 'mosje_alyssa_fissa', attachments: [] })).toEqual({ rows: [], count: 0, max: 2 });
    expect(getAttachmentRows(null).count).toBe(0);
  });
  it('Jeffrey The Strongman has max 3', () => {
    expect(getAttachmentRows({ cardId: 'mosje_jeffrey' }).max).toBe(3);
  });
  it('real state: gear and pet rows with name, text and kind', () => {
    const state = stateWith('mosje_alyssa_fissa');
    expect(attachToMosje(state, 'player_1', 0, 'piecie_dumbbells').ok).toBe(true);
    expect(attachToMosje(state, 'player_1', 0, 'piecie_tony').ok).toBe(true);
    const out = getAttachmentRows(state.players.player_1.activeSlots[0]);
    expect(out.count).toBe(2);
    expect(out.rows[0]).toMatchObject({ cardId: 'piecie_dumbbells', name: 'Dumbbells', kind: 'gear' });
    expect(out.rows[0].text).toContain('Attach');
    expect(out.rows[1]).toMatchObject({ cardId: 'piecie_tony', kind: 'pet' });
  });
  it('The Protector is kind protector', () => {
    const out = getAttachmentRows({ cardId: 'x', attachments: [{ cardId: 'snelle_the_protector' }] });
    expect(out.rows[0].kind).toBe('protector');
  });
  it('an unknown card id never throws', () => {
    const out = getAttachmentRows({ cardId: 'x', attachments: [{ cardId: 'nope_1' }] });
    expect(out.rows[0]).toMatchObject({ cardId: 'nope_1', name: 'nope_1', text: '', kind: 'neutral' });
  });
});

describe('getAttachmentChips', () => {
  it('maps rows to interactive chip specs in order', () => {
    const chips = getAttachmentChips([{ cardId: 'a', name: 'A', kind: 'gear', text: '' }, { cardId: 'b', name: 'B', kind: 'pet', text: '' }]);
    expect(chips).toEqual([
      { label: 'A', kind: 'gear', title: 'A', interactive: true, data: { 'card-id': 'a' } },
      { label: 'B', kind: 'pet', title: 'B', interactive: true, data: { 'card-id': 'b' } },
    ]);
  });
});

describe('toMosjeTileCards', () => {
  it('carries attachments and max on the tile, chips come out as gear and pet', () => {
    const state = stateWith('mosje_alyssa_fissa');
    attachToMosje(state, 'player_1', 0, 'piecie_dumbbells');
    attachToMosje(state, 'player_1', 0, 'piecie_tony');
    const [tile] = toMosjeTileCards(state, 'player_1');
    expect(tile.maxAttachments).toBe(2);
    expect(tile.attachments.map((a: any) => a.cardId)).toEqual(['piecie_dumbbells', 'piecie_tony']);
    const chips = getAttachmentChips(getAttachmentRows(tile).rows);
    expect(chips.map((c: any) => c.kind)).toEqual(['gear', 'pet']);
  });
  it('a bare Mosje has an empty list', () => {
    const [tile] = toMosjeTileCards(stateWith('mosje_jeffrey'), 'player_1');
    expect(tile.attachments).toEqual([]);
    expect(tile.maxAttachments).toBe(3);
  });
});

describe('dock line and detail section', () => {
  it('panel lines gain an attachments line only when present', () => {
    const none = getCardPanelLines({ type: 'MOSJE' });
    expect(none.find((l: any) => l.kind === 'attachments')).toBeUndefined();
    const lines = getCardPanelLines({ type: 'MOSJE', attachments: [{ cardId: 'piecie_dumbbells' }, { cardId: 'piecie_tony' }], maxAttachments: 2 });
    expect(lines.find((l: any) => l.kind === 'attachments').text).toBe('Attachments 2 / 2: Dumbbells, Tony');
  });
  it('section shows the count and full text, escaped', () => {
    const html = buildAttachmentSection({ rows: [{ cardId: 'a', name: '<b>X</b>', text: 'a & b', kind: 'gear' }], count: 1, max: 2 });
    expect(html).toContain('Attachments 1 / 2');
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;');
    expect(html).toContain('a &amp; b');
    expect(buildAttachmentSection({ rows: [], count: 0, max: 3 })).toContain('Attachments 0 / 3');
  });
});
