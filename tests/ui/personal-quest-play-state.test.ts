// Phase 72-04: play state, Mosje options, fail sentence and dice row for a Personal Quest in hand (D-02, D-03, D-04).
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { pqWorld } from '../helpers/personalQuestKit.js';
// @ts-ignore
import { mkSlot } from '../helpers/quest56.js';
import { getPersonalQuestPlayState } from '../../src/ui/personalQuests/getPersonalQuestPlayState.js';
import { buildPersonalQuestMosjeOptions } from '../../src/ui/personalQuests/buildPersonalQuestMosjeOptions.js';
import { describePersonalQuestFail } from '../../src/ui/personalQuests/describePersonalQuestFail.js';
import { buildDiceRowHtml } from '../../src/ui/dice/buildDiceRowHtml.js';

const P = 'player_1';
const play = (s: any, local = true) => getPersonalQuestPlayState(s, P, 'pq_charge', { isLocalTurn: local });

describe('getPersonalQuestPlayState', () => {
  it('ok when a Level 3 Mosje of the right type may attempt', () => {
    const r = play(pqWorld({ cardId: 'pq_charge', mp: 60 }));
    expect(r.ok).toBe(true);
    expect(r.reason).toBe('');
    expect(r.mosjes).toEqual([{ slotIndex: 0, ok: true }]);
  });
  it('not your turn comes first', () => {
    const r = play(pqWorld({ cardId: 'pq_charge', mp: 60 }), false);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('It is not your turn');
  });
  it('no Level 3 Mosje on the field', () => {
    const r = play(pqWorld({ cardId: 'pq_charge', slot: { level: 1 } }));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('You have no Level 3 Mosje');
  });
  it('Level 3 Mosje of the wrong type gives the engine type sentence', () => {
    const r = play(pqWorld({ cardId: 'pq_charge', type: 'DIGITAL' }));
    expect(r.reason).toMatch(/physical type Mosje/);
  });
  it('Level 3 Mosje that did not start the turn at Level 3', () => {
    const r = play(pqWorld({ cardId: 'pq_charge', slot: { levelAtTurnStart: 2 } }));
    expect(r.reason).toBe('This Mosje must have started this turn at Level 3');
  });
  it('Needs not met names the Need', () => {
    const r = play(pqWorld({ cardId: 'pq_charge', mp: 20 }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/31/);
  });
  it('prefers the reason of the Level 3 Mosje of the right type over a Level 1 Mosje', () => {
    const s = pqWorld({ cardId: 'pq_charge', mp: 20, second: mkSlot({ level: 1 }) });
    const r = play(s);
    expect(r.reason).toMatch(/31/);
    expect(r.mosjes.length).toBe(2);
  });
});

describe('buildPersonalQuestMosjeOptions', () => {
  it('lists legal Mosjes first, the rest greyed with their reason', () => {
    const s = pqWorld({ cardId: 'pq_charge', mp: 60 });
    s.players[P].activeSlots = [mkSlot({ level: 1 }), s.players[P].activeSlots[0]];
    const opts = buildPersonalQuestMosjeOptions(s, P, 'pq_charge');
    expect(opts.map((o: any) => o.id)).toEqual(['1', '0']);
    expect(opts[0].disabled).toBe(false);
    expect(opts[1].disabled).toBe(true);
    expect(opts[1].metaLabel).toMatch(/Level 3/);
    expect(opts[0].metaLabel).toBe('Level 3, 60 MP');
    expect(opts[0].card.cardId).toBe(s.players[P].activeSlots[1].cardId);
    expect(opts[0].label).toBe(s.players[P].activeSlots[1].name);
  });
  it('escapes the meta label', () => {
    const s = pqWorld({ cardId: 'pq_charge', mp: 60 });
    s.players[P].activeSlots[0].level = 1;
    const o = buildPersonalQuestMosjeOptions(s, P, 'pq_charge')[0];
    expect(o.metaLabel).not.toMatch(/[<>]/);
  });
});

describe('describePersonalQuestFail', () => {
  const before = { graveyard: [{ cardId: 'a' }] };
  it('names what was discarded', () => {
    const after = { graveyard: [{ cardId: 'a' }, { cardId: 'piecie_affoe' }, { cardId: 'mosje_alyssa_bulldozer' }] };
    const t = describePersonalQuestFail(before, after, 'Charge!');
    expect(t.startsWith('Charge! failed: discarded ')).toBe(true);
    expect(t).toMatch(/the card went back to your deck$/);
    expect(t).toMatch(/Affoe/i);
  });
  it('says nothing was discarded', () => {
    expect(describePersonalQuestFail(before, before, 'Charge!')).toBe('Charge! failed: nothing was discarded, the card went back to your deck');
  });
});

describe('buildDiceRowHtml', () => {
  it('draws one die per number', () => {
    const h = buildDiceRowHtml([4, 6, 1]);
    expect(h.match(/class="die"/g)?.length).toBe(3);
    expect(h).toContain('data-face="6"');
    expect(h).toContain('dice-row');
  });
  it('shows the need text, escaped', () => {
    const h = buildDiceRowHtml([2], { need: 'Need <b>2x 4+</b>' });
    expect(h).toContain('Need &lt;b&gt;2x 4+&lt;/b&gt;');
    expect(h).not.toContain('<b>');
  });
  it('escapes die values and returns empty for no dice', () => {
    expect(buildDiceRowHtml(['<i>'] as any)).not.toContain('<i>');
    expect(buildDiceRowHtml([])).toBe('');
    expect(buildDiceRowHtml(undefined as any)).toBe('');
  });
});
