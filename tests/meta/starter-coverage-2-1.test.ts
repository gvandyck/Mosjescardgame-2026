// Phase 71-25 (D-37): coverage guard for the 86 starter cards of the three Obby 2.1 starter decks.
// Every starter card needs (1) an effect handler, (2) a unit test that names it, (3) a card-test-library row.
// The three checks are small functions that take their inputs as arguments, so the fake-gap cases below can
// prove each check fails when a card is missing.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
// @ts-ignore JS modules
import { STARTER_DECKS_21 } from '../../src/data/starterDecks21.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
// @ts-ignore
import { PLACES } from '../../src/data/places.js';
// @ts-ignore
import * as piecieEffects from '../../src/abilities/piecieEffects.js';
// @ts-ignore
import * as snelleEffects from '../../src/abilities/snelleEffects.js';
// @ts-ignore
import { STARTER_HANDLER_FILES } from '../helpers/starterHandlers.js';
// @ts-ignore
import { MOSJE_REGISTRY } from '../ui/cards/mosje-registry-2-0.js';
// @ts-ignore
import { PIECIE_REGISTRY } from '../ui/cards/piecie-registry-2-0.js';
// @ts-ignore
import { SNELLE_REGISTRY } from '../ui/cards/snelle-registry-2-0.js';
// @ts-ignore
import { PLACE_REGISTRY } from '../ui/cards/place-registry-2-0.js';
// @ts-ignore
import { PERSONAL_QUEST_REGISTRY } from '../ui/cards/personal-quest-registry-2-1.js';

const ROOT = join(__dirname, '..', '..');
type Kind = 'mosje' | 'personalQuest' | 'place' | 'piecie' | 'snelle';
type Starter = { id: string; kind: Kind };

const LISTS: [Kind, string][] = [
  ['mosje', 'mosjes'], ['personalQuest', 'personalQuests'], ['place', 'places'], ['piecie', 'piecies'], ['snelle', 'snellePiecies'],
];

// The union of the three starter decks, each id once.
const starters: Starter[] = [];
for (const [kind, list] of LISTS) {
  const ids = new Set<string>(STARTER_DECKS_21.flatMap((d: any) => d[list]));
  for (const id of ids) starters.push({ id, kind });
}
const byId = (data: any[]) => new Map<string, any>(data.map((c) => [c.id, c]));
const DATA = { mosje: byId(MOSJES), place: byId(PLACES), piecie: byId(PIECIES), snelle: byId(SNELLE_PIECIES) };

// ---- Check 1: handler ----
// Piecie / Snelle: the effectId is an exported function. Mosje / Place / Personal Quest: an entry in the handler table
// whose file exists and contains the card's needle (a Mosje: its ability id; otherwise the card id).
export function missingHandlers(
  cards: Starter[], effectIdOf: (c: Starter) => string | undefined, needleOf: (c: Starter) => string | undefined,
  piecieExports: any, snelleExports: any, table: Record<string, string>, readSrc: (rel: string) => string | null,
): string[] {
  return cards.filter((c) => {
    if (c.kind === 'piecie') return typeof piecieExports[effectIdOf(c) as string] !== 'function';
    if (c.kind === 'snelle') return typeof snelleExports[effectIdOf(c) as string] !== 'function';
    const file = table[c.id];
    if (!file) return true;
    const text = readSrc(file);
    const needle = needleOf(c);
    return text === null || !needle || !text.includes(needle);
  }).map((c) => c.id);
}

// ---- Check 2: unit test ----
// The id appears as a quoted string in at least one tests/**/starter-*.test.ts (this guard file is not counted).
export function missingUnitTests(cards: Starter[], testTexts: string[]): string[] {
  return cards.filter((c) => !testTexts.some((t) => /['"`]/.test(t) && new RegExp(`['"\`]${c.id}['"\`]`).test(t))).map((c) => c.id);
}

// ---- Check 3: card-test-library row ----
export function missingRows(cards: Starter[], registries: Record<Kind, any[]>): string[] {
  return cards.filter((c) => !registries[c.kind].some((r) => r[c.kind] === c.id && r.cases?.length > 0)).map((c) => c.id);
}

const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const unitTestTexts = walk(join(ROOT, 'tests'))
  .filter((f) => /[\\/]starter-[^\\/]*\.test\.ts$/.test(f) && !f.endsWith('starter-coverage-2-1.test.ts'))
  .map((f) => readFileSync(f, 'utf8'));
const readSrc = (rel: string) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : null);
const effectIdOf = (c: Starter) => (DATA as any)[c.kind]?.get(c.id)?.effectId;
const needleOf = (c: Starter) => (c.kind === 'mosje' ? DATA.mosje.get(c.id)?.abilityId : c.id);
const REGISTRIES: Record<Kind, any[]> = {
  mosje: MOSJE_REGISTRY, personalQuest: PERSONAL_QUEST_REGISTRY, place: PLACE_REGISTRY, piecie: PIECIE_REGISTRY, snelle: SNELLE_REGISTRY,
};
const runHandlers = (cards: Starter[], table = STARTER_HANDLER_FILES) =>
  missingHandlers(cards, effectIdOf, needleOf, piecieEffects, snelleEffects, table, readSrc);

describe('starter coverage guard (D-37)', () => {
  it('lists exactly 86 starter ids: 15 Mosjes, 12 Personal Quests, 42 Piecies, 8 Snelle, 9 Places', () => {
    const n = (k: Kind) => starters.filter((s) => s.kind === k).length;
    expect([n('mosje'), n('personalQuest'), n('piecie'), n('snelle'), n('place')]).toEqual([15, 12, 42, 8, 9]);
    expect(starters.length).toBe(86);
  });

  it('every starter card has an effect handler', () => {
    expect(runHandlers(starters), 'starter cards without a handler').toEqual([]);
  });

  it('every starter card is named in a starter-*.test.ts unit test', () => {
    expect(missingUnitTests(starters, unitTestTexts), 'starter cards without a unit test').toEqual([]);
  });

  it('every starter card has a card-test-library row with at least one case', () => {
    expect(missingRows(starters, REGISTRIES), 'starter cards without a registry row').toEqual([]);
  });

  describe('the guard can fail (fake inputs with one card missing)', () => {
    it('handler check reports a Piecie, a Snelle and a table card that lost their handler', () => {
      const piecie = starters.find((s) => s.kind === 'piecie') as Starter;
      const snelle = starters.find((s) => s.kind === 'snelle') as Starter;
      const place = starters.find((s) => s.kind === 'place') as Starter;
      const fakePiecieExports = { ...piecieEffects, [effectIdOf(piecie) as string]: undefined };
      const fakeSnelleExports = { ...snelleEffects, [effectIdOf(snelle) as string]: undefined };
      const { [place.id]: _gone, ...fakeTable } = STARTER_HANDLER_FILES as Record<string, string>;
      expect(missingHandlers([piecie], effectIdOf, needleOf, fakePiecieExports, snelleEffects, STARTER_HANDLER_FILES, readSrc)).toEqual([piecie.id]);
      expect(missingHandlers([snelle], effectIdOf, needleOf, piecieEffects, fakeSnelleExports, STARTER_HANDLER_FILES, readSrc)).toEqual([snelle.id]);
      expect(runHandlers([place], fakeTable)).toEqual([place.id]);
    });

    it('handler check reports a table card whose file does not exist or lacks the card', () => {
      const place = starters.find((s) => s.kind === 'place') as Starter;
      expect(runHandlers([place], { [place.id]: 'src/does/not/exist.js' })).toEqual([place.id]);
      expect(runHandlers([place], { [place.id]: 'src/data/personalQuests.js' })).toEqual([place.id]);
    });

    it('unit-test check reports an id taken out of the test-file text', () => {
      const target = starters[0];
      const stripped = unitTestTexts.map((t) => t.split(target.id).join('x'));
      expect(missingUnitTests(starters, stripped)).toContain(target.id);
      expect(missingUnitTests([target], stripped)).toEqual([target.id]);
    });

    it('registry check reports a card whose row was taken out, or whose row has no case', () => {
      for (const kind of ['mosje', 'personalQuest', 'place', 'piecie', 'snelle'] as Kind[]) {
        const target = starters.find((s) => s.kind === kind) as Starter;
        const without = { ...REGISTRIES, [kind]: REGISTRIES[kind].filter((r) => r[kind] !== target.id) };
        expect(missingRows(starters, without as any)).toEqual([target.id]);
        const noCases = { ...REGISTRIES, [kind]: REGISTRIES[kind].map((r) => (r[kind] === target.id ? { ...r, cases: [] } : r)) };
        expect(missingRows(starters, noCases as any)).toEqual([target.id]);
      }
    });
  });
});
