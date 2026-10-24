// Phase 62-05: the 2.0 field tile for every card type (62-UI-SPEC "Field tile", Phase 7 A3 / A4 / A7, D-06 / D-07 / D-08).
// Mosje tile = name + nickname on one line, L<n> chip, POWER box, MP box. Piecie / Snelle / Place tile = name, type pill, STAYS chip
// when the card stays. Quest tile = name, need, WIN / LOSE, 2 fail pips. No tile shows a cost (already paid, decided in the UI-SPEC).
import { describe, it, expect } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { PLACES } from '../../src/data/places.js';
import { QUESTS } from '../../src/data/quests.js';
import { buildMosjeSpecV1 } from '../../src/ui/cardV1/buildMosjeSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const alyssa = (MOSJES as any[]).find((m) => m.name === 'Alyssa, The Bulldozer');
const piecie = (name: string) => (PIECIES as any[]).find((p) => p.name === name);
const snelle = (name: string) => (SNELLE_PIECIES as any[]).find((p) => p.name === name);
const quest = (id: string) => (QUESTS as any[]).find((q) => q.id === id);
const stackQuests = (QUESTS as any[]).filter((q) => q.stack);

// No DOM in this vitest env: read the tile from its html string.
const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tile = (card: any, extra: any = {}) => buildCardV1({ ...card, ...extra }, { fieldMode: true })!.html;
const attr = (html: string, name: string) => html.match(new RegExp(`data-cv1-${name}="([^"]*)"`))?.[1] ?? null;
const count = (html: string, needle: string) => html.split(needle).length - 1;
const nameLine = (html: string) => html.match(/<div class="cv2-tile-name">(.*?)<\/div>/s)?.[1] ?? null;
const pills = (html: string) => html.match(/<div class="cv2-tile-pills">(.*?)<\/div>/s)?.[1] ?? null;
// the inside of a stat / need box carrying data-cv1-<hook>: its value, optional sub and label divs
const box = (html: string, hook: string) => html.match(new RegExp(`<div class="cv2-tile-(?:stat|need)[^"]*" data-cv1-${hook}="[^"]*">(.*?</div>)</div>`, 's'))?.[1] ?? null;
const part = (inner: string | null, cls: string) => inner?.match(new RegExp(`<div class="cv2-tile-${cls}">(.*?)</div>`, 's'))?.[1] ?? null;

describe('2.0 field tile: Mosje', () => {
  const html = tile(alyssa, { mp: 20, level: 3 });

  it('is the 2.0 tile root with the frame tier hook', () => {
    expect(html).toMatch(/<div class="cv1-face cv1-face--2 cv2-tile" data-cv1-tier="4"/);
  });

  it('name and nickname share one line', () => {
    const line = nameLine(html)!;
    expect(line).toContain('>Alyssa<');
    expect(line).toContain('>The Bulldozer<');
    expect(line).toContain('class="cv2-first"');
    expect(line).toContain('class="cv2-nick"');
  });

  it('Level 3 chip (LVL 3 · HOLD) centre-bottom, POWER box and MP box carry the live numbers', () => {
    expect(html).toMatch(/<div class="cv2-tile-lvl" data-cv1-level="3">LVL 3 · HOLD<\/div>/); // spec change D-17: a Level 3 Mosje holds
    expect(attr(html, 'power')).toBe('40');
    expect(part(box(html, 'power'), 'val')).toBe('40');
    expect(part(box(html, 'power'), 'label')).toBe('POWER');
    expect(attr(html, 'mp')).toBe('20');
    expect(part(box(html, 'mp'), 'val')).toBe('20');
    expect(part(box(html, 'mp'), 'label')).toBe('MP');
    expect(html).toMatch(/cv2-tile-stat cv2-tile-stat--left" data-cv1-power/);
    expect(html).toMatch(/cv2-tile-stat cv2-tile-stat--right" data-cv1-mp/);
  });

  it('has no cost, no text box and no legacy tile parts', () => {
    expect(html).not.toContain('data-cv1-cost');
    expect(html).not.toContain('cv2-text');
    expect(html).not.toContain('cv2-corner');
    for (const legacy of ['cv1-fdesc', 'cv1-badge', 'cv1-pill', 'cv1-name', 'cv1-desc', 'cv1-info']) expect(html, legacy).not.toContain(legacy);
  });

  it('defaults to L1 and the level 1 Power / start MP when the card carries no live state', () => {
    const fresh = tile(alyssa, { mp: undefined, level: undefined, power: undefined });
    expect(attr(fresh, 'level')).toBe('1');
    expect(attr(fresh, 'power')).toBe(String(alyssa.levels[0].power));
    expect(attr(fresh, 'mp')).toBe(String(alyssa.startMP ?? 0));
  });

  it('only Level 3 reads HOLD: Level 1 and 2 keep the short L<n> chip', () => {
    for (const level of [1, 2]) {
      const t = tile(alyssa, { mp: 20, level });
      expect(t).toMatch(new RegExp(`<div class="cv2-tile-lvl" data-cv1-level="${level}">L${level}</div>`));
      expect(t).not.toContain('HOLD');
    }
  });

  it('a Tactician temp MP shows big with the real MP small under it; the hook keeps the real MP', () => {
    const t = tile(alyssa, { mp: 20, level: 3, tempMp: 75 });
    expect(part(box(t, 'mp'), 'val')).toBe('75');
    expect(part(box(t, 'mp'), 'sub')).toBe('20');
    expect(attr(t, 'mp')).toBe('20');
    expect(part(box(html, 'mp'), 'sub')).toBeNull(); // no temp MP: no small number
  });

  it('the spec carries the clamped level for the tile and no legacy tile keys', () => {
    expect(buildMosjeSpecV1({ ...alyssa, level: 3 }).level).toBe(3);
    expect(buildMosjeSpecV1(alyssa).level).toBe(1);
    expect(buildMosjeSpecV1({ ...alyssa, level: 9 }).level).toBe(3);
    expect(buildMosjeSpecV1({ ...alyssa, level: 0 }).level).toBe(1); // level0-ok: Level 0 input is normalised to 1
    const spec = buildMosjeSpecV1(alyssa) as any;
    expect('fieldPill' in spec).toBe(false);
    expect('badge' in spec).toBe(false);
  });

  it('every Mosje has a tile with its name, an L chip, Power and MP and no cost', () => {
    for (const m of MOSJES as any[]) {
      const t = tile(m);
      expect(t, m.id).toMatch(/data-cv1-level="[123]"/);
      expect(attr(t, 'power'), m.id).not.toBeNull();
      expect(attr(t, 'mp'), m.id).not.toBeNull();
      expect(t, m.id).not.toContain('data-cv1-cost');
      expect(nameLine(t), m.id).toContain('class="cv2-first"');
    }
  });
});

describe('2.0 field tile: Piecie, Snelle, Place', () => {
  it('a Piecie tile has the PIECIE pill and no cost, no Free, no COST label', () => {
    const t = tile(piecie('Kannetje Melk'));
    expect(pills(t)).toContain('<span class="cv2-pill">PIECIE</span>');
    expect(t).toContain('>Kannetje Melk<');
    expect(t).not.toContain('data-cv1-cost');
    expect(t).not.toContain('Free');
    expect(t).not.toContain('>COST<');
    expect(t).not.toContain('data-cv1-stays');
    expect(t).not.toContain('cv2-tile-lvl');
    expect(t).not.toContain('cv2-tile-stat');
  });

  it('the STAYS chip sits beside the pill on exactly the 15 Piecies that stay (Welloe Force has one, Kannetje Melk none)', () => {
    const force = tile(piecie('Welloe Force'));
    expect(force).toContain('data-cv1-stays="true"');
    expect(pills(force)).toMatch(/<span class="cv2-pill">PIECIE<\/span><span class="cv2-chip" data-cv1-stays="true">STAYS<\/span>/);
    const live = (PIECIES as any[]).filter((p) => !p.disabled);
    expect(live.filter((p) => p.stays)).toHaveLength(15);
    for (const p of live) expect(tile(p).includes('data-cv1-stays="true"'), p.id).toBe(Boolean(p.stays));
  });

  it('a Snelle tile has the SNELLE pill, no cost; Blensen! (stays) has the STAYS chip', () => {
    const t = tile(snelle('Lucky Cóin'));
    expect(pills(t)).toContain('<span class="cv2-pill">SNELLE</span>');
    expect(t).not.toContain('data-cv1-cost');
    expect(t).not.toContain('>COST<');
    expect(t).not.toContain('Free');
    for (const p of SNELLE_PIECIES as any[]) expect(tile(p).includes('data-cv1-stays="true"'), p.id).toBe(Boolean(p.stays));
  });

  it('a Place tile has the PLACE pill and no cost, no chip', () => {
    const t = tile((PLACES as any[]).find((p) => p.name === 'The Gym'));
    expect(pills(t)).toContain('<span class="cv2-pill">PLACE</span>');
    expect(t).not.toContain('data-cv1-cost');
    expect(t).not.toContain('>COST<');
    expect(t).not.toContain('data-cv1-stays');
  });

  it('every Piecie, Snelle and Place has a tile: name line, type pill, no text box, no cost, no legacy parts', () => {
    for (const [cards, pill] of [[PIECIES, 'PIECIE'], [SNELLE_PIECIES, 'SNELLE'], [PLACES, 'PLACE']] as const) {
      for (const c of cards as any[]) {
        const t = tile(c);
        expect(nameLine(t), c.id).not.toBeNull();
        expect(pills(t), c.id).toContain(`<span class="cv2-pill">${pill}</span>`);
        for (const bad of ['data-cv1-cost', 'cv2-text', 'cv1-fdesc', 'cv1-badge', 'cv1-pill']) expect(t, `${c.id} ${bad}`).not.toContain(bad);
      }
    }
  });
});

describe('2.0 field tile: Quest', () => {
  const arm = quest('quest_arm_wrestling');

  it('shows the need, WIN and LOSE from the spec', () => {
    const t = tile(arm);
    expect(attr(t, 'need')).toBe('2× 4+');
    expect(part(box(t, 'need'), 'val')).toBe('2× 4+');
    expect(attr(t, 'win')).toBe('40');
    expect(part(box(t, 'win'), 'val')).toBe('+40');
    expect(part(box(t, 'win'), 'label')).toBe('WIN');
    expect(attr(t, 'lose')).toBe('-30');
    expect(unescape(part(box(t, 'lose'), 'val')!)).toBe('−30');
    expect(part(box(t, 'lose'), 'label')).toBe('LOSE');
    expect(nameLine(t)).toContain('>Arm Wrestling<');
    expect(t).not.toContain('cv2-tile-lvl');
    expect(t).not.toContain('data-cv1-power');
    expect(t).not.toContain('data-cv1-cost');
  });

  it('has exactly 2 fail pips: failTokens 0 -> 0 filled, 1 -> 1 filled, 2 -> 2 filled', () => {
    for (const [tokens, filled] of [[0, 0], [1, 1], [2, 2]] as const) {
      const t = tile(arm, { failTokens: tokens });
      expect(count(t, 'data-cv1-pip='), `tokens ${tokens}`).toBe(2);
      expect(count(t, 'data-cv1-pip="filled"'), `tokens ${tokens}`).toBe(filled);
      expect(count(t, 'data-cv1-pip="empty"'), `tokens ${tokens}`).toBe(2 - filled);
    }
    expect(count(tile(arm), 'data-cv1-pip="filled"')).toBe(0); // no failTokens at all
  });

  it('clamps the fail tokens to 0..2 and survives junk', () => {
    expect(count(tile(arm, { failTokens: 5 }), 'data-cv1-pip="filled"')).toBe(2);
    expect(count(tile(arm, { failTokens: -3 }), 'data-cv1-pip="filled"')).toBe(0);
    expect(count(tile(arm, { failTokens: '"><x' }), 'data-cv1-pip="filled"')).toBe(0);
  });

  it('a Trained Quest tile prints "can\'t fail" for LOSE and keeps the star need', () => {
    const t = tile(quest('quest_sprint_race'));
    expect(attr(t, 'lose')).toBe('none');
    expect(unescape(part(box(t, 'lose'), 'val')!)).toBe("can't fail");
    expect(attr(t, 'need')).toBe('★★');
  });

  it('every 2.0 Quest has a tile with need, win, lose and 2 pips, in its stack colour', () => {
    expect(stackQuests).toHaveLength(38);
    const colour: Record<string, string> = { FIGHTING: '#C2410C', DIGITAL: '#0E7490', ARTISTIC: '#A21CAF' };
    for (const q of stackQuests) {
      const t = tile(q);
      expect(attr(t, 'need'), q.id).not.toBeNull();
      expect(attr(t, 'win'), q.id).toBe(String(q.win));
      expect(attr(t, 'lose'), q.id).not.toBeNull();
      expect(count(t, 'data-cv1-pip='), q.id).toBe(2);
      expect(t, q.id).toContain(colour[q.stack]);
      expect(t, q.id).toContain('cv2-quest-art'); // no real art: the die placeholder fills the window
    }
  });

  it('the 10 V4 Quests (no stack) still get no 2.0 tile', () => {
    for (const q of (QUESTS as any[]).filter((x) => !x.stack)) expect(buildCardV1(q, { fieldMode: true }), q.id).toBeNull();
  });
});

describe('2.0 field tile: shared rules', () => {
  const samples = [alyssa, piecie('Kannetje Melk'), snelle('Lucky Cóin'), (PLACES as any[])[0], quest('quest_arm_wrestling')];

  it('no tile at any rarity contains tier chrome', () => {
    for (const c of samples) {
      for (const tier of [1, 2, 3, 4, 5]) {
        const t = tile(c, { rarity: '★'.repeat(tier) });
        expect(t).not.toMatch(/ct-/); // tier chrome classes (ct-holo, ct-foil ...); "object-position" is not chrome
        expect(t).not.toContain('cv1-stripe');
        expect(t).not.toContain('cv1-diamond');
      }
    }
  });

  it('the className keeps the field classes and the frame tier', () => {
    expect(buildCardV1(alyssa, { fieldMode: true })!.className).toBe('card-v1 card-v1--field card--tier-4 card--fullart card--tierlayout');
    expect(buildCardV1(quest('quest_arm_wrestling'), { fieldMode: true })!.className).toBe('card-v1 card-v1--field card--tier-1 card--boxed card--tierlayout');
  });

  it('puts the type colours on the tile root', () => {
    expect(tile(alyssa)).toContain('--cv1-main:#C2410C;--cv1-tint:#FFEDD5');
    expect(tile(piecie('Kannetje Melk'))).toContain('--cv1-main:#15803D');
  });

  it('keeps the art when the card has some and draws no <img> when it has none (T-62-08 safe)', () => {
    expect(tile(alyssa, { artPath: 'assets/x/real-art.png' })).toContain('<img class="cv1-art"');
    expect(tile(alyssa, { artPath: '' })).not.toContain('<img');
  });

  it('escapes markup in the name, nickname and a hostile fail-token value (T-62-08)', () => {
    const evil = tile({ ...alyssa, name: '<img src=x onerror=1>, The <b>Boss</b>"><i>' });
    for (const bad of ['<img src=x', '<b>Boss', '"><i>']) expect(evil, bad).not.toContain(bad);
    expect(evil).toContain('&lt;img src=x onerror=1&gt;');
    expect(evil).toContain('&lt;b&gt;Boss&lt;/b&gt;&quot;&gt;&lt;i&gt;');
    const evilPiecie = tile({ ...piecie('Welloe Force'), name: '"><script>x</script>' });
    expect(evilPiecie).not.toContain('<script>');
    expect(evilPiecie).toContain('&quot;&gt;&lt;script&gt;');
    const evilQuest = tile({ ...quest('quest_arm_wrestling'), name: '"><svg onload=1>', failTokens: '"><svg onload=1>' });
    expect(evilQuest).not.toContain('<svg onload');
    expect(evilQuest).toContain('&quot;&gt;&lt;svg onload=1&gt;');
    const evilMp = tile({ ...alyssa, mp: '"><i>', tempMp: 5 });
    expect(evilMp).not.toContain('"><i>');
  });
});
