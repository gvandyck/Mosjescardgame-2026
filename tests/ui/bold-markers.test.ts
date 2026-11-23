// Card texts mark a bold lead with ** ("**Attach:** +10 Power."). No screen may show the two stars: a face draws the lead bold,
// a plain-text place drops the markers.
import { describe, it, expect } from 'vitest';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { PLACES } from '../../src/data/places.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { formatAbilityLine } from '../../src/ui/cardV1/formatAbilityLine.js';
import { boldMarkersToHtml } from '../../src/ui/cardV1/boldMarkersToHtml.js';
import { stripBoldMarkers } from '../../src/ui/cardV1/stripBoldMarkers.js';
import { getAttachmentRows } from '../../src/ui/board/getAttachmentRows.js';

describe('bold markers in card texts', () => {
  it('boldMarkersToHtml turns **x** into <b>x</b> and leaves other text alone', () => {
    expect(boldMarkersToHtml('**Attach:** +10 Power.')).toBe('<b>Attach:</b> +10 Power.');
    expect(boldMarkersToHtml('Draw 1. **Discarded:** draw 2.')).toBe('Draw 1. <b>Discarded:</b> draw 2.');
    expect(boldMarkersToHtml('No markers.')).toBe('No markers.');
  });

  it('stripBoldMarkers gives plain text', () => {
    expect(stripBoldMarkers('**Attach:** +10 Power.')).toBe('Attach: +10 Power.');
    expect(stripBoldMarkers(undefined)).toBe('');
  });

  it('formatAbilityLine draws a marked lead bold, escapes the rest', () => {
    expect(formatAbilityLine('**Attach:** +1 die on Quests that roll Str.')).toBe('<b>Attach:</b> +1 die on Quests that roll Str.');
    expect(formatAbilityLine('**Combo:** <x> +20 instead.')).toBe('<b>Combo:</b> &lt;x&gt; +20 instead.');
    expect(formatAbilityLine('Unstoppable: this Mosje wins.')).toBe('<b>Unstoppable:</b> this Mosje wins.'); // unchanged
  });

  const marked = [...(PIECIES as any[]), ...(SNELLE_PIECIES as any[]), ...(PLACES as any[])].filter((c) => String(c.description || '').includes('**'));

  it('there are marked card texts to guard', () => {
    expect(marked.length).toBeGreaterThan(5);
  });

  it.each(marked.map((c) => [c.id, c]))('%s: the face shows no stars', (_id, card) => {
    const html = buildCardV1(card, {})!.html;
    expect(html).not.toContain('**');
  });

  it('an attachment row (hover dock, detail list) carries plain text', () => {
    const { rows } = getAttachmentRows({ attachments: [{ cardId: 'piecie_dumbbells' }] });
    expect(rows[0].text).toBe('Attach: +1 die on Quests that roll Str.');
  });
});
