import { describe, it, expect } from 'vitest';
// @ts-ignore plain js modules
import { getCardSheetSections } from '../../src/ui/phone/getCardSheetSections.js';
// @ts-ignore
import { buildCardSheetContent } from '../../src/ui/phone/buildCardSheetContent.js';
// @ts-ignore
import { readCardSheetData } from '../../src/ui/phone/readCardSheetData.js';

// 72.1-06 (D-06, T-72.1-11, T-72.1-12): what the phone card sheet shows, in order, from public tile data only.

const mosje = {
  name: 'Alyssa, The Bulldozer', typeLabel: 'Mosje', level: 2, mp: 45, power: 20,
  text: [{ label: 'Ability', text: 'Gets +10 Power after losing MP.' }],
  attachments: { rows: [{ name: 'Dumbbells', text: '+10 Power.' }, { name: 'Keyboard', text: 'Draw a card.' }], max: 2 },
  tags: [{ text: '+10 Power until end of next turn', kind: 'power' }, { text: 'Shield: blocks the next attack completely', kind: 'shield' }],
  panelLines: [{ kind: 'flavour', text: 'Nothing stops her.' }, { kind: 'rarity', text: 'Rare' }, { kind: 'attachments', text: 'Attachments 2 / 2: Dumbbells, Keyboard' }],
};

// A tiny fake document: enough to see which text and which property the builder writes.
function fakeDoc() {
  const make = (tag: string): any => {
    const el: any = {
      tag, children: [] as any[], className: '', dataset: {} as Record<string, string>, _text: '', htmlWrites: 0,
      set textContent(v: string) { el._text = String(v); },
      get textContent() { return el._text + el.children.map((c: any) => c.textContent).join(''); },
      set innerHTML(_v: string) { el.htmlWrites += 1; },
      appendChild(c: any) { el.children.push(c); return c; },
      append(...cs: any[]) { cs.forEach((c) => el.children.push(c)); },
    };
    return el;
  };
  return { createElement: make, createDocumentFragment: () => make('#fragment') };
}
const walk = (el: any, out: any[] = []) => { out.push(el); (el.children || []).forEach((c: any) => walk(c, out)); return out; };

describe('getCardSheetSections', () => {
  it('lists the sections in order: type line, stats, text, attachments, effects, panel', () => {
    const sections = getCardSheetSections(mosje);
    expect(sections.map((s: any) => s.id)).toEqual(['type', 'stats', 'text', 'attachments', 'effects', 'panel']);
    expect(sections[0].text).toBe('Mosje');
    expect(sections[1].items).toEqual(['Level 2', '45 MP', 'Power 20']);
  });

  it('attachments: "Attachments 2 / 2" with each name and its short text', () => {
    const att = getCardSheetSections(mosje).find((s: any) => s.id === 'attachments');
    expect(att.title).toBe('Attachments 2 / 2');
    expect(att.rows).toEqual([{ name: 'Dumbbells', text: '+10 Power.' }, { name: 'Keyboard', text: 'Draw a card.' }]);
  });

  it('effects: the FULL text of every tag, not shortened', () => {
    const fx = getCardSheetSections(mosje).find((s: any) => s.id === 'effects');
    expect(fx.title).toBe('Effects');
    expect(fx.rows.map((r: any) => r.text)).toEqual(['+10 Power until end of next turn', 'Shield: blocks the next attack completely']);
  });

  it('panel: the card panel lines, without the attachments line (it has its own section)', () => {
    const panel = getCardSheetSections(mosje).find((s: any) => s.id === 'panel');
    expect(panel.rows.map((r: any) => r.kind)).toEqual(['flavour', 'rarity']);
  });

  it('a card with none of those has no empty section', () => {
    const sections = getCardSheetSections({ name: 'Doner', typeLabel: 'Piecie', level: null, mp: null, power: null, text: [], attachments: null, tags: [], panelLines: [] });
    expect(sections.map((s: any) => s.id)).toEqual(['type']);
    const noAtt = getCardSheetSections({ ...mosje, attachments: { rows: [], max: 2 } });
    expect(noAtt.find((s: any) => s.id === 'attachments')).toBeUndefined();
  });

  it('stats skip the numbers a card does not have', () => {
    const s = getCardSheetSections({ ...mosje, level: null, power: null }).find((x: any) => x.id === 'stats');
    expect(s.items).toEqual(['45 MP']);
  });
});

describe('buildCardSheetContent', () => {
  it('writes every text through textContent: an injected <img onerror> name stays text', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const doc: any = fakeDoc();
    const root = buildCardSheetContent({ ...mosje, name: evil, attachments: { rows: [{ name: evil, text: evil }], max: 2 }, tags: [{ text: evil, kind: 'power' }] }, doc);
    const all = walk(root);
    expect(all.every((el: any) => el.htmlWrites === 0), 'innerHTML is never written').toBe(true);
    expect(root.textContent).toContain(evil);
    expect(all.some((el: any) => el.tag === 'img')).toBe(false);
  });

  it('has one element per section, in order', () => {
    const root: any = buildCardSheetContent(mosje, fakeDoc());
    const ids = root.children.map((c: any) => c.dataset.section);
    expect(ids).toEqual(['type', 'stats', 'text', 'attachments', 'effects', 'panel']);
  });
});

describe('readCardSheetData (T-72.1-12: only what the tile already shows)', () => {
  it('reads nothing but the tile dataset and its live stat hooks', () => {
    const touched = new Set<string | symbol>();
    const tile = new Proxy({
      dataset: { cardId: 'mosje_gandoe_wizard', attachments: 'piecie_tony', maxAttachments: '2', tags: JSON.stringify([{ text: 'Shield', kind: 'shield' }]) },
      querySelector: () => null,
    } as any, { get(target, prop) { touched.add(prop); return target[prop]; } });
    const data = readCardSheetData(tile);
    expect(data.name).toContain('Wizard');
    expect(data.attachments.rows).toHaveLength(1);
    expect(data.attachments.max).toBe(2);
    expect(data.tags).toEqual([{ text: 'Shield', kind: 'shield' }]);
    expect([...touched].filter((p) => !['dataset', 'querySelector'].includes(String(p)))).toEqual([]);
  });

  it('an unknown card id, junk tags and a junk max never throw', () => {
    expect(readCardSheetData({ dataset: { cardId: 'nope' }, querySelector: () => null } as any)).toBeNull();
    const data = readCardSheetData({ dataset: { cardId: 'mosje_gandoe_wizard', tags: '{not json', maxAttachments: 'x', attachments: 'piecie_tony' }, querySelector: () => null } as any);
    expect(data.tags).toEqual([]);
    expect(data.attachments).toBeNull();
  });
});
