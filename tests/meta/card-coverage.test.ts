// Phase 60-08 (TEST-02): coverage guard - every one of the 183 Obby 2.0 Card List cards has at least one 2.0 card-test-library case.
// 32 Mosjes + 38 Quests + 73 Piecies + 20 Snelle + 20 Places = 183. Parked / cut ids ("Not in 2.0" in the Card List) are excluded by name.
import { describe, expect, it } from 'vitest';
// @ts-ignore JS modules
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { QUESTS } from '../../src/data/quests.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
// @ts-ignore
import { PLACES } from '../../src/data/places.js';
// @ts-ignore
import { MOSJE_REGISTRY } from '../ui/cards/mosje-registry-2-0.js';
// @ts-ignore
import { QUEST_REGISTRY } from '../ui/cards/quest-registry-2-0.js';
// @ts-ignore
import { PIECIE_REGISTRY } from '../ui/cards/piecie-registry-2-0.js';
// @ts-ignore
import { SNELLE_REGISTRY } from '../ui/cards/snelle-registry-2-0.js';
// @ts-ignore
import { PLACE_REGISTRY } from '../ui/cards/place-registry-2-0.js';

// Card List "Not in 2.0 (parked or cut)": parked Mosjes and Place, cut Piecie and Quests, and the web game's 6 Personal Quests.
const NOT_IN_2_0 = new Set([
  'mosje_binti_creator', 'mosje_amplifier', 'mosje_coert_kastelein', 'place_momentum_factory', 'piecie_mp_adjuster',
  'quest_elimination_challenge', 'quest_the_gauntlet', 'quest_chain_master', 'quest_precision_work',
  'quest_west_perfect_read', 'quest_personal_iron_will', 'quest_personal_perfect_sync', 'quest_personal_lucky_crescendo',
  'quest_personal_winston_tijd', 'quest_personal_kickboxing_bootcamp',
]);

type Kind = { name: string; count: number; data: any[]; registry: any[]; key: string };
const kinds: Kind[] = [
  { name: 'Mosjes', count: 32, data: MOSJES, registry: MOSJE_REGISTRY, key: 'mosje' },
  { name: 'Quests', count: 38, data: QUESTS, registry: QUEST_REGISTRY, key: 'quest' },
  { name: 'Piecies', count: 73, data: PIECIES, registry: PIECIE_REGISTRY, key: 'piecie' },
  { name: 'Snelle', count: 20, data: SNELLE_PIECIES, registry: SNELLE_REGISTRY, key: 'snelle' },
  { name: 'Places', count: 20, data: PLACES, registry: PLACE_REGISTRY, key: 'place' },
];
const live = (k: Kind) => k.data.filter((c) => !NOT_IN_2_0.has(c.id)).map((c) => c.id as string);
const covered = (k: Kind) => new Set(k.registry.filter((r) => r.cases?.length).map((r) => r[k.key] as string));

describe('card-test coverage of the Card List (TEST-02)', () => {
  it('the Card List has 183 cards: 32 Mosjes, 38 Quests, 73 Piecies, 20 Snelle, 20 Places', () => {
    for (const k of kinds) expect(live(k), k.name).toHaveLength(k.count);
    expect(kinds.reduce((n, k) => n + live(k).length, 0)).toBe(183);
  });

  for (const k of kinds) {
    it(`every ${k.name} card has at least one 2.0 card-test case`, () => {
      const have = covered(k);
      expect(live(k).filter((id) => !have.has(id)), `${k.name} without a case`).toEqual([]);
    });

    it(`every ${k.name} registry entry names a live 2.0 card (no unknown, parked or cut ids)`, () => {
      const ids = new Set(live(k));
      expect(k.registry.map((r) => r[k.key] as string).filter((id) => !ids.has(id)), `${k.name} registry ids`).toEqual([]);
    });
  }

  it('in the registries that label decks, a card\'s first entry for every Example Deck card comes before the first entry of any other card', () => {
    for (const k of kinds.filter((x) => ['quest', 'piecie', 'snelle', 'place'].includes(x.key))) {
      const first = new Map<string, { index: number; deck: string }>();
      k.registry.forEach((r, index) => { if (!first.has(r[k.key])) first.set(r[k.key], { index, deck: r.deck }); });
      const examples = [...first.values()].filter((f) => f.deck === 'example').map((f) => f.index);
      const rest = [...first.values()].filter((f) => f.deck !== 'example').map((f) => f.index);
      expect(Math.max(-1, ...examples) < Math.min(Infinity, ...rest), `${k.name}: an Example Deck card is first covered after a non-example card`).toBe(true);
    }
  });
});
