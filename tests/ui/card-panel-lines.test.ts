import { describe, it, expect } from 'vitest';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { PLACES } from '../../src/data/places.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { QUESTS } from '../../src/data/quests.js';
import { getCardPanelLines } from '../../src/ui/cardV1/getCardPanelLines.js';
import { buildCardPanel } from '../../src/ui/cardV1/buildCardPanel.js';

// Phase 62 D-09: flavour, rarity, "Limit 1 per deck" and the per-type reminder live in the hover / detail panel,
// not on the face. The reminder copy is the 62-UI-SPEC Copywriting contract.
const PIECIE_REMINDER = 'Place face-down for free. From your next turn, pay its cost to activate it.';
const SNELLE_REMINDER = "Play from your hand at any time, also on your opponent's turn, with saved Energy. Needs a free Piecie slot.";
const PLACE_REMINDER = 'Play from your hand on your turn. Works at once and stays until destroyed. Fresh Mosjes ignore it.';

const piecie = (name: string) => (PIECIES as any[]).find((c) => c.name === name);
const kinds = (lines: any[]) => lines.map((l) => l.kind);

describe('getCardPanelLines (D-09)', () => {
  it('Harde Didde (limit 1, 5 stars, no flavour): rarity, limit and the Piecie reminder', () => {
    const lines = getCardPanelLines(piecie('Harde Didde'));
    expect(lines).toEqual([
      { kind: 'rarity', text: '★★★★★' },
      { kind: 'limit', text: 'Limit 1 per deck' },
      { kind: 'reminder', text: PIECIE_REMINDER },
    ]);
  });

  it('a card with flavour text gets the flavour line first', () => {
    const lines = getCardPanelLines({ type: 'PIECIE', rarity: '★★', flavourText: 'Lekker.', limitPerDeck: 2 });
    expect(lines[0]).toEqual({ kind: 'flavour', text: 'Lekker.' });
    expect(kinds(lines)).toEqual(['flavour', 'rarity', 'reminder']);
  });

  it('Kannetje Melk (limitPerDeck 2): no limit line', () => {
    const lines = getCardPanelLines(piecie('Kannetje Melk'));
    expect(kinds(lines)).toEqual(['rarity', 'reminder']);
    expect(lines.find((l: any) => l.kind === 'limit')).toBeUndefined();
  });

  it('every Snelle gets the Snelle reminder, every Place the Place reminder', () => {
    for (const card of SNELLE_PIECIES as any[]) {
      expect(getCardPanelLines(card).find((l: any) => l.kind === 'reminder')?.text, card.name).toBe(SNELLE_REMINDER);
    }
    for (const card of PLACES as any[]) {
      expect(getCardPanelLines(card).find((l: any) => l.kind === 'reminder')?.text, card.name).toBe(PLACE_REMINDER);
    }
  });

  it('Mosjes get flavour / rarity / limit but no reminder', () => {
    for (const card of MOSJES as any[]) {
      const lines = getCardPanelLines(card);
      expect(kinds(lines), card.name).not.toContain('reminder');
      expect(lines.find((l: any) => l.kind === 'rarity')?.text, card.name).toBe(card.rarity);
      expect(kinds(lines).includes('limit'), card.name).toBe(card.limitPerDeck === 1);
    }
  });

  it('2.0 Quests get no rarity and no reminder', () => {
    const quests = (QUESTS as any[]).filter((q) => q.stack);
    expect(quests.length).toBeGreaterThan(0);
    for (const card of quests) {
      const lines = getCardPanelLines(card);
      expect(kinds(lines), card.name).not.toContain('rarity');
      expect(kinds(lines), card.name).not.toContain('reminder');
    }
  });

  it('"Limit 1 per deck" shows exactly when limitPerDeck is 1, on every card type', () => {
    const all = [...(PIECIES as any[]), ...(SNELLE_PIECIES as any[]), ...(PLACES as any[]), ...(MOSJES as any[])];
    for (const card of all) {
      const has = getCardPanelLines(card).some((l: any) => l.kind === 'limit' && l.text === 'Limit 1 per deck');
      expect(has, card.name).toBe(card.limitPerDeck === 1);
    }
  });

  it('no card, an unknown type and an empty card all give no lines', () => {
    expect(getCardPanelLines(null)).toEqual([]);
    expect(getCardPanelLines({ type: 'UNKNOWN' })).toEqual([]);
  });
});

describe('buildCardPanel (D-09)', () => {
  it('is an empty string when there are no lines', () => {
    expect(buildCardPanel(null)).toBe('');
    expect(buildCardPanel({ type: 'UNKNOWN' })).toBe('');
  });

  it('is one .cv2-panel with one line per entry, in order', () => {
    const html = buildCardPanel(piecie('Harde Didde'));
    expect(html.match(/class="cv2-panel"/g)).toHaveLength(1);
    expect(html.match(/cv2-panel-line /g)).toHaveLength(3);
    expect(html.indexOf('★★★★★')).toBeLessThan(html.indexOf('Limit 1 per deck'));
    expect(html.indexOf('Limit 1 per deck')).toBeLessThan(html.indexOf(PIECIE_REMINDER));
  });

  it('T-62-10: flavour and rarity text are escaped, never markup', () => {
    const html = buildCardPanel({ type: 'MOSJE', rarity: '<b>★</b>', flavourText: '<img src=x onerror=alert(1)> "quote" & more', limitPerDeck: 2 });
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt; &quot;quote&quot; &amp; more');
  });
});
