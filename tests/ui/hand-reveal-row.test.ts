// The hand viewer (a card shows you the opponent's hand) lists one row per card: its name and its type in plain words.
// It used to print the raw type right after the name ("VarkenspootjesPIECIE").
import { describe, it, expect } from 'vitest';
import { buildHandRevealRowHtml } from '../../src/ui/modals/buildHandRevealRowHtml.js';

describe('hand reveal row', () => {
  it('shows the name, a separator and the type label', () => {
    const html = buildHandRevealRowHtml('piecie_x', { piecie_x: { name: 'Varkenspootjes', type: 'PIECIE' } });
    expect(html).toBe('<li><span class="hand-reveal-name">Varkenspootjes</span><span class="hand-reveal-type"> · Piecie</span></li>');
    expect(html.replace(/<[^>]+>/g, '')).toBe('Varkenspootjes · Piecie');
  });
  it('says Snelle for a Snelle Piecie and escapes the name', () => {
    expect(buildHandRevealRowHtml('s', { s: { name: 'Jensen<!>', type: 'SNELLE_PIECIE' } }).replace(/<[^>]+>/g, '')).toBe('Jensen&lt;!&gt; · Snelle');
  });
  it('an unknown card shows its id and no type', () => {
    expect(buildHandRevealRowHtml('mystery', {})).toBe('<li><span class="hand-reveal-name">mystery</span></li>');
  });
});
