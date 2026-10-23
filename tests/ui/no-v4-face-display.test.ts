import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Phase 62 D-03 / D-04: no screen shows the V4 requirement code, the V4 "Free" / "N MP" cost or the V4 copy-limit
// text. The 2.0 cards carry `cost` (Energy) and `needsText`; the old `requirement` / `mpCost` data fields have no reader
// in the UI anymore, and the ?cardv1=off face switch is gone. This guard reads the UI sources as text.
function listJs(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listJs(p) : p.endsWith('.js') ? [p] : [];
  });
}
const uiFiles = [...listJs('src/ui'), 'src/deck-builder.js'];
const allSrc = listJs('src');
const read = (f: string) => fs.readFileSync(f, 'utf8');

const BANNED: [string, RegExp][] = [
  ['the V4 requirement code (.requirement)', /\.requirement\b/],
  ['the V4 cost field (mpCost)', /\bmpCost\b/],
  ['the old "MP COST" label', /MP COST/],
  ['the old "Requires:" line', /Requires:/],
  ['the old Snelle copy', /Instant - play any time/],
  ['the V4 copy-limit text', /Max per deck/],
];

describe('no V4 card text on any screen (D-03, D-04)', () => {
  for (const [label, pattern] of BANNED) {
    it(`no UI file shows ${label}`, () => {
      const hits = uiFiles.filter((f) => pattern.test(read(f)));
      expect(hits).toEqual([]);
    });
  }

  it('the ?cardv1=off switch is gone: no source file mentions isCardV1Enabled or cardv1=off', () => {
    const hits = allSrc.filter((f) => /isCardV1Enabled|cardv1=off/.test(read(f)));
    expect(hits).toEqual([]);
    expect(fs.existsSync('src/ui/cardV1/isCardV1Enabled.js')).toBe(false);
  });

  it('the dead V4 renderer functions are gone from cardRenderer.js', () => {
    const src = read('src/ui/cardRenderer.js');
    for (const name of ['buildMosjeCardHTML', 'buildPlaceCardHTML', 'buildCardWithArt', 'describeAbility', 'renderMpMeta',
      'shortMosjeName', 'getOwnedActivePiecieIds', 'formatIdLabel', 'buildOnFieldMosjeMeta', 'TRAIT_ICONS', 'TRAIT_COLORS']) {
      expect(src, name).not.toContain(name);
    }
  });
});
