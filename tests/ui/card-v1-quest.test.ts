// Phase 62-04: the 2.0 Quest face (Phase 7 A7). Every value is checked against the Card List (parseCardList).
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
import { QUESTS } from '../../src/data/quests.js';
import { QUEST_BANDS } from '../../src/data/questBands.js';
import { TYPE_COLORS } from '../../src/ui/cardV1/typeColors.js';
import { getQuestNeed } from '../../src/ui/cardV1/getQuestNeed.js';
import { formatQuestRollsLine } from '../../src/ui/cardV1/formatQuestRollsLine.js';
import { formatQuestStakes } from '../../src/ui/cardV1/formatQuestStakes.js';
import { getQuestTextLines } from '../../src/ui/cardV1/getQuestTextLines.js';
import { buildQuestArt } from '../../src/ui/cardV1/buildQuestArt.js';
import { buildQuestSpecV1 } from '../../src/ui/cardV1/buildQuestSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const quests = (QUESTS as any[]).filter((q) => q.stack);
const byId = (id: string) => (QUESTS as any[]).find((q) => q.id === id);
const rowOf = (q: any) => (list.quests as any[]).find((r) => CARD_ID_MAP.quests[r.name] === q.id);

// No DOM in this vitest env: read the 2.0 face from its html string.
const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const part = (html: string, cls: string) => {
  const m = html.match(new RegExp(`<div class="${cls}"[^>]*>(.*?)</div>`, 's'));
  return m ? unescape(m[1]) : null;
};
const attr = (html: string, name: string) => html.match(new RegExp(`data-cv1-${name}="([^"]*)"`))?.[1] ?? null;
// '' when the face has no text box (a Quest with no cost and no Also text)
const textBox = (html: string) => {
  const i = html.indexOf('<div class="cv2-textbox">');
  return i < 0 ? '' : html.slice(i).split(/<div class="cv2-(?:info|pills|footer)">/)[0];
};
const plain = (html: string) => unescape(html.replace(/<\/div>\s*<div/g, '</div> <div').replace(/<[^>]+>/g, ''));
const windowOf = (html: string) => html.slice(html.indexOf('<div class="cv1-window">'), html.indexOf('<div class="cv2-corner"'));
const footerPill = (html: string) => html.match(/<span class="cv2-footer-pill">([^<]*)<\/span>/)?.[1] ?? null;
const BAND_LABEL: Record<string, string> = { steady: 'Steady', skilled: 'Skilled', heroic: 'Heroic', prepared: 'Prepared', gated: 'Gated', coin_flip: 'Coin flip', trained: 'Trained' };

describe('there are 38 2.0 Quests and 10 leftover V4 Quests', () => {
  it('counts', () => {
    expect(quests).toHaveLength(38);
    expect((QUESTS as any[]).filter((q) => !q.stack)).toHaveLength(10);
  });
});

describe('getQuestNeed (dice need, top-left)', () => {
  it('one-success bands show plain 4+, two-success bands 2× 4+ / 2× 5+', () => {
    for (const band of ['steady', 'prepared', 'gated']) expect(getQuestNeed({ band }), band).toEqual({ hook: 'need', value: '4+', label: 'NEED' });
    expect(getQuestNeed({ band: 'skilled' })).toEqual({ hook: 'need', value: '2× 4+', label: 'NEED' });
    expect(getQuestNeed({ band: 'heroic' })).toEqual({ hook: 'need', value: '2× 5+', label: 'NEED' });
  });
  it('Coin flip is 4+ COIN, Trained is ★★ TRAINED, an unknown band is null', () => {
    expect(getQuestNeed({ band: 'coin_flip' })).toEqual({ hook: 'need', value: '4+', label: 'COIN' });
    expect(getQuestNeed({ band: 'trained' })).toEqual({ hook: 'need', value: '★★', label: 'TRAINED' });
    expect(getQuestNeed({ band: 'nope' })).toBeNull();
    expect(getQuestNeed({})).toBeNull();
  });
  it('every band in the band table maps to a need (read from QUEST_BANDS, not hard-coded)', () => {
    for (const band of Object.keys(QUEST_BANDS)) expect(getQuestNeed({ band }), band).not.toBeNull();
  });
});

describe('formatQuestRollsLine', () => {
  it('prints Rolls: <trait> · <band> for the four shapes', () => {
    expect(formatQuestRollsLine(byId('quest_arm_wrestling'))).toBe('Rolls: Physical · Skilled');
    expect(formatQuestRollsLine(byId('quest_sprint_race'))).toBe('Rolls: no roll · Trained');
    expect(formatQuestRollsLine(byId('quest_geen_raad_vraag_aad'))).toBe('Rolls: no trait · Coin flip');
    expect(formatQuestRollsLine(byId('quest_ultimate_challenge'))).toBe("Rolls: Mosje's best trait · Heroic");
  });
  it('for all 38 the trait part equals the Card List rolls cell and the band part its band', () => {
    for (const q of quests) {
      const m = formatQuestRollsLine(q).match(/^Rolls: (.+) · (.+)$/);
      expect(m, q.id).not.toBeNull();
      expect(m![1], q.id).toBe(rowOf(q).rolls);
      expect(m![2], q.id).toBe(BAND_LABEL[rowOf(q).band]);
    }
  });
});

describe('formatQuestStakes (WIN / LOSE footer)', () => {
  it('Arm Wrestling wins +40 and loses −30 (U+2212)', () => {
    const s = formatQuestStakes(byId('quest_arm_wrestling'));
    expect(s.win).toEqual({ value: '+40', hookValue: 40 });
    expect(s.lose).toEqual({ value: '−30', hookValue: -30 });
  });
  it("a Trained Quest can't fail", () => {
    expect(formatQuestStakes(byId('quest_sprint_race')).lose).toEqual({ value: "can't fail", hookValue: 'none' });
  });
  it('all 38 equal the Card List win / lose', () => {
    for (const q of quests) {
      const row = rowOf(q);
      const s = formatQuestStakes(q);
      expect(s.win.value, q.id).toBe(`+${row.win}`);
      expect(s.win.hookValue, q.id).toBe(row.win);
      if (row.lose === null) expect(s.lose, q.id).toEqual({ value: "can't fail", hookValue: 'none' });
      else expect(s.lose, q.id).toEqual({ value: `−${Math.abs(row.lose)}`, hookValue: row.lose });
    }
  });
});

describe('getQuestTextLines', () => {
  it('First you must comes first, then the Also text with every ** removed', () => {
    const q = { costText: 'Discard 1 ready Piecie', extras: 'Win: jab. **Vraag Aad:** when you fail, you may discard 1 card.' };
    expect(getQuestTextLines(q)).toEqual(['First you must: Discard 1 ready Piecie', 'Win: jab.', 'Vraag Aad: when you fail, you may discard 1 card.']);
    expect(getQuestTextLines({ costText: null, extras: 'Win: jab.' })).toEqual(['Win: jab.']);
    expect(getQuestTextLines({ costText: 'A Place is in play', extras: null })).toEqual(['First you must: A Place is in play']);
    expect(getQuestTextLines({ costText: null, extras: null })).toEqual([]);
  });
  it('for all 38 the lines are exactly the Card List cost + extras, formatting only', () => {
    for (const q of quests) {
      const row = rowOf(q);
      const want = [row.costText ? `First you must: ${row.costText}` : '', row.extras ? String(row.extras).replace(/\*\*/g, '') : ''].filter(Boolean).join(' ');
      expect(getQuestTextLines(q).join(' '), q.id).toBe(want);
      expect(getQuestTextLines(q).join(''), q.id).not.toContain('**');
    }
  });
});

describe('2.0 Quest face', () => {
  it('uses the stack colour for the whole card and the rose Quest colour is gone', () => {
    for (const q of quests) {
      const html = buildCardV1(q)!.html;
      expect(html, q.id).toContain(`--cv1-main:${(TYPE_COLORS as any)[q.stack].main}`);
      expect(html, q.id).not.toContain('#BE123C');
    }
    expect((TYPE_COLORS as any).QUEST).toBeUndefined();
    expect(buildCardV1(byId('quest_arm_wrestling'))!.html).toContain('--cv1-main:#C2410C');
    expect(buildCardV1(byId('quest_debug_system'))!.html).toContain('--cv1-main:#0E7490');
    expect(buildCardV1(byId('quest_leap_of_faith'))!.html).toContain('--cv1-main:#A21CAF');
  });

  it('Arm Wrestling: need 2× 4+ NEED, Rolls line, win / lose, FIGHTING QUEST pill, tier 1 boxed', () => {
    const r = buildCardV1(byId('quest_arm_wrestling'))!;
    const html = r.html;
    expect(r.className).toBe('card-v1 card-v1--full card--tier-1 card--boxed card--tierlayout');
    expect(attr(html, 'need')).toBe('2× 4+');
    expect(html).toContain('<div class="cv2-corner-label">NEED</div>');
    expect(part(html, 'cv2-info')).toBe('Rolls: Physical · Skilled');
    expect(attr(html, 'win')).toBe('40');
    expect(attr(html, 'lose')).toBe('-30');
    expect(html).toContain('<div class="cv2-stat-val">+40</div>');
    expect(html).toContain('<div class="cv2-stat-val">−30</div>');
    expect(html).toContain('>WIN<');
    expect(html).toContain('>LOSE<');
    expect(footerPill(html)).toBe('FIGHTING QUEST');
    expect(html).not.toContain('cv2-pills');
    expect(html).not.toContain('cv2-label"');
  });

  it('Trained: ★★ TRAINED, win only, the right column says can\'t fail with no LOSE label', () => {
    const html = buildCardV1(byId('quest_debug_system'))!.html;
    expect(attr(html, 'need')).toBe('★★');
    expect(html).toContain('<div class="cv2-corner-label">TRAINED</div>');
    expect(attr(html, 'win')).toBe('25');
    expect(attr(html, 'lose')).toBe('none');
    expect(html).toContain('cv2-stat-val cv2-stat-val--word">can&#39;t fail</div>');
    expect(html).not.toContain('>LOSE<');
    expect(footerPill(html)).toBe('DIGITAL QUEST');
  });

  it('Coin flip: 4+ COIN', () => {
    const html = buildCardV1(byId('quest_leap_of_faith'))!.html;
    expect(attr(html, 'need')).toBe('4+');
    expect(html).toContain('<div class="cv2-corner-label">COIN</div>');
    expect(attr(html, 'lose')).toBe('-25');
    expect(footerPill(html)).toBe('ARTISTIC QUEST');
  });

  it('has no LVL chip, no Power / MP / cost, no diamonds, and prints no V4 Success / Failure text or MP numbers', () => {
    for (const q of quests) {
      const html = buildCardV1(q)!.html;
      expect(html, q.id).not.toContain('cv2-lvl-chip');
      expect(html, q.id).not.toMatch(/data-cv1-(power|mp|cost)/);
      expect(html, q.id).not.toContain('ct-diamond--lit');
      expect(html, q.id).not.toMatch(/Success:|Failure:|Correct guess|Wrong guess|SUCCESS|MP COST/);
      for (const v4 of [q.successMP, q.failMP]) {
        if (Number.isFinite(v4) && ![q.win, q.lose].some((n) => Math.abs(n ?? 0) === Math.abs(v4))) {
          expect(html, `${q.id} ${v4}`).not.toMatch(new RegExp(`[+−-]${Math.abs(v4)}(?!\\d)`));
        }
      }
    }
  });

  it('the info line, text box and footer show the Card List values for every Quest', () => {
    for (const q of quests) {
      const row = rowOf(q);
      const html = buildCardV1(q)!.html;
      expect(part(html, 'cv2-info'), q.id).toBe(formatQuestRollsLine(q));
      const shown = [row.costText ? `First you must: ${row.costText}` : '', row.extras ? String(row.extras).replace(/\*\*/g, '') : ''].filter(Boolean).join(' ');
      expect(plain(textBox(html)).replace(/\s+/g, ' ').trim(), q.id).toBe(shown);
      expect(attr(html, 'win'), q.id).toBe(String(row.win));
      expect(footerPill(html), q.id).toBe(`${row.stack} QUEST`);
      expect(part(html, 'cv2-corner-val'), q.id).toBe(getQuestNeed(q)!.value);
    }
  });

  it('puts the stack-colour die placeholder in the art window when the quest has no real art, and the image when it has', () => {
    const q = byId('quest_arm_wrestling');
    expect(q.artPath).toMatch(/placeholder\.png$/);
    const placeholder = windowOf(buildCardV1(q)!.html);
    expect(placeholder).toContain('<i class="cv2-quest-art" aria-hidden="true">');
    expect(placeholder).toContain('<svg');
    expect(placeholder).not.toContain('<img');
    const withArt = windowOf(buildCardV1({ ...q, artPath: 'assets/quests/arm.png' })!.html);
    expect(withArt).toContain('<img class="cv1-art"');
    expect(withArt).not.toContain('cv2-quest-art');
    expect(buildQuestArt()).toContain('cv2-quest-art');
  });

  it('is a 2.0 spec: face 2, QUEST type key, pill footer, no level rows, no top pill / label', () => {
    const spec = buildQuestSpecV1(byId('quest_arm_wrestling')) as any;
    expect(spec).toMatchObject({ face: 2, typeKey: 'QUEST', pill: '', label: '', stays: false, levelRows: [], failTokens: 0 });
    expect('fieldPill' in spec).toBe(false); // the legacy tile keys went with the legacy tile (62-05)
    expect('badge' in spec).toBe(false);
    expect(spec.corner).toEqual({ hook: 'need', value: '2× 4+', label: 'NEED' });
    expect(spec.footer.centre).toEqual({ kind: 'pill', chip: 'FIGHTING QUEST', label: '' });
    expect(spec.footer.left).toMatchObject({ value: '+40', label: 'WIN', hook: 'win', hookValue: 40 });
    expect(spec.footer.right).toMatchObject({ value: '−30', label: 'LOSE', hook: 'lose', hookValue: -30 });
    const trained = buildQuestSpecV1(byId('quest_sprint_race')) as any;
    expect(trained.footer.right).toMatchObject({ value: "can't fail", label: '', hook: 'lose', hookValue: 'none', word: true });
  });

  it('the 10 V4 Quests without a stack get no 2.0 face (the unified template draws them)', () => {
    const v4 = (QUESTS as any[]).filter((q) => !q.stack);
    expect(v4).toHaveLength(10);
    for (const q of v4) {
      expect(buildQuestSpecV1(q), q.id).toBeNull();
      expect(buildCardV1(q), q.id).toBeNull();
      expect(buildCardV1(q, { fieldMode: true }), q.id).toBeNull();
    }
  });

  it('field tile: name, need, WIN / LOSE and 2 fail pips (empty ring / filled dot)', () => {
    const r = buildCardV1(byId('quest_arm_wrestling'), { fieldMode: true })!;
    expect(r.className).toBe('card-v1 card-v1--field card--tier-1 card--boxed card--tierlayout');
    expect(r.html).toContain('>Arm Wrestling<');
    expect(attr(r.html, 'need')).toBe('2× 4+');
    expect(attr(r.html, 'win')).toBe('40');
    expect(attr(r.html, 'lose')).toBe('-30');
    expect(r.html).toContain('>+40<');
    expect(r.html).toContain('>WIN<');
    expect(r.html).toContain('>LOSE<');
    expect(r.html.split('data-cv1-pip=').length - 1).toBe(2);
    expect(r.html.split('data-cv1-pip="filled"').length - 1).toBe(0);
    expect(buildCardV1({ ...byId('quest_arm_wrestling'), failTokens: 1 }, { fieldMode: true })!.html.split('data-cv1-pip="filled"').length - 1).toBe(1);
    expect(buildCardV1({ ...byId('quest_arm_wrestling'), failTokens: 2 }, { fieldMode: true })!.html.split('data-cv1-pip="filled"').length - 1).toBe(2);
    expect(r.html).not.toContain('>QUEST<'); // no legacy QUEST pill any more
  });

  it('escapes markup in the name, cost, Also text and need (T-62-06): ** is stripped as text, never turned into HTML', () => {
    const evil = { ...byId('quest_arm_wrestling'), name: '<img src=x onerror=1>', costText: '<script>x</script>', extras: 'Win: <i>x</i>. **Bold:** <b>y</b>' };
    const html = buildCardV1(evil)!.html;
    for (const bad of ['<img src=x', '<script', '<i>x', '<b>y']) expect(html, bad).not.toContain(bad);
    expect(html).toContain('&lt;img src=x onerror=1&gt;');
    expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
    expect(html).not.toContain('**');
    expect(html).not.toMatch(/<(strong|em)\b/);
  });
});
