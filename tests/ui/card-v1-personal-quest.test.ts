// Phase 72-02: the Personal Quest face (D-01). Blocks Needs / Pay / Roll are the printed strings, unchanged.
import { describe, it, expect } from 'vitest';
import { PERSONAL_QUESTS } from '../../src/data/personalQuests.js';
import { TYPE_COLORS } from '../../src/ui/cardV1/typeColors.js';
import { getFrameTier } from '../../src/data/getFrameTier.js';
import { getPersonalQuestBlocks } from '../../src/ui/cardV1/getPersonalQuestBlocks.js';
import { buildPersonalQuestSpecV1 } from '../../src/ui/cardV1/buildPersonalQuestSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { buildFaceTextBox } from '../../src/ui/cardV1/buildFaceTextBox.js';
import { getCardPanelLines } from '../../src/ui/cardV1/getCardPanelLines.js';

const pqs = PERSONAL_QUESTS as any[];
const byId = (id: string) => pqs.find((c) => c.id === id);
const LABEL: Record<string, string> = { needs: 'Needs', pay: 'Pay', roll: 'Roll' };

describe('getPersonalQuestBlocks', () => {
  it('returns Needs, Pay, Roll in order with the printed strings', () => {
    const c = byId('pq_charge');
    expect(getPersonalQuestBlocks(c)).toEqual([
      { key: 'needs', label: 'Needs', text: 'this Mosje has 31+ MP.' },
      { key: 'pay', label: 'Pay', text: 'this Mosje loses 30 MP.' },
      { key: 'roll', label: 'Roll', text: '1 ▣ per Str★. Need 2× ⚃+.' },
    ]);
  });
  it('leaves out a block the card does not have', () => {
    expect(getPersonalQuestBlocks(byId('pq_vibe_coded')).map((b) => b.key)).not.toContain('pay');
    expect(getPersonalQuestBlocks(byId('pq_world_record_run')).map((b) => b.key)).not.toContain('needs');
    expect(getPersonalQuestBlocks(byId('pq_beginners_luck')).map((b) => b.key)).toEqual(['pay', 'roll']);
  });
  it('every block text of all 12 starter cards equals the data string', () => {
    expect(pqs.length).toBe(12);
    for (const c of pqs) {
      for (const b of getPersonalQuestBlocks(c)) expect(b.text, `${c.id} ${b.key}`).toBe(c[`${b.key}Text`]);
      const expected = ['needs', 'pay', 'roll'].filter((k) => c[`${k}Text`]);
      expect(getPersonalQuestBlocks(c).map((b) => b.key)).toEqual(expected);
    }
  });
});

describe('buildPersonalQuestSpecV1', () => {
  it('is a face-2 spec in the type colour', () => {
    for (const c of pqs) {
      const s = buildPersonalQuestSpecV1(c);
      expect(s.face).toBe(2);
      expect(s.typeKey).toBe('PERSONAL_QUEST');
      expect(s.colors).toEqual((TYPE_COLORS as any)[c.mosjeType]);
      expect(s.name.first).toBe(c.name);
      expect(s.corner).toBeNull();
      expect(s.footer).toBeNull();
      expect(s.pill).toBe('PERSONAL QUEST');
      expect(s.lines).toEqual(s.blocks.map((b: any) => b.text));
    }
    expect(buildPersonalQuestSpecV1(byId('pq_charge')).label).toBe('Physical Mosje, Level 3');
  });
  it('falls back to Physical colours for an unknown type', () => {
    const s = buildPersonalQuestSpecV1({ ...byId('pq_charge'), mosjeType: 'WEIRD' });
    expect(s.colors).toEqual(TYPE_COLORS.PHYSICAL);
  });
});

describe('buildCardV1 for a Personal Quest', () => {
  it('draws the v1 face with block hooks and the star tier', () => {
    for (const c of pqs) {
      const v = buildCardV1(c) as any;
      expect(v, c.id).not.toBeNull();
      expect(v.html).toContain(c.name.replace(/&/g, '&amp;').replace(/'/g, '&#39;'));
      for (const b of getPersonalQuestBlocks(c)) {
        expect(v.html).toContain(`data-cv1-pq-block="${b.key}"`);
        expect(v.html).toContain(`>${LABEL[b.key]}<`);
      }
      expect(v.dataTier).toBe(String(getFrameTier(c)));
    }
  });
  it('escapes card text (T-72-03)', () => {
    const html = buildFaceTextBox(buildPersonalQuestSpecV1({ ...byId('pq_charge'), needsText: '<b>x</b>' }));
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('panel lines', () => {
  it('adds the Personal Quest reminder after the rarity line', () => {
    const lines = getCardPanelLines(byId('pq_charge'));
    expect(lines.map((l: any) => l.kind)).toEqual(['rarity', 'reminder']);
    expect(lines[1].text).toContain('Level 3');
  });
});
