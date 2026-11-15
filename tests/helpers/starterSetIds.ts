// Phase 69-03: the ids (and names) of the 2.1 starter set, read from the read-only handover/cards.json.
// The tests that still compare src/data with the superseded 10 Oct Card List skip these cards: the new
// guard tests/data/starter-set-2-1.test.ts pins them to cards.json instead.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const J = JSON.parse(readFileSync(join(__dirname, '..', '..', 'docs', 'obby-2.0', 'handover', 'cards.json'), 'utf8'));
const starterMosjes: any[] = J.mosjes.filter((m: any) => m.set === 'starter');
const starterCards: any[] = J.cards.filter((c: any) => c.starter === true || c.set === 'starter');

/** data ids of the starter Mosjes, Piecies, Snelle and Places that already existed before 2.1 */
export const STARTER_DATA_IDS: Set<string> = new Set([
  ...starterMosjes.map((m) => m.dataId),
  ...starterCards.filter((c) => !c.isNew).map((c) => c.dataId),
]);
/** the new 2.1 names (17 cards without an old id) */
export const STARTER_NEW_NAMES: Set<string> = new Set(starterCards.filter((c) => c.isNew).map((c) => c.name));
export const isStarterId = (id: string) => STARTER_DATA_IDS.has(id);

/**
 * Cards of the 10 Oct Card List that are disabled (data kept) since Phase 69: the 2.1 archive plus Mosjes hidden earlier
 * (e.g. mosje_drainer, unhidden in Obby 2.0 and archived again in 2.1). Not part of HIDDEN_CARD_IDS (scripts/obby2).
 */
export const ARCHIVED_BY_2_1: string[] = [
  'mosje_ming_predictor',
  'mosje_martin_historian',
  'mosje_hacker',
  'mosje_chris',
  'mosje_tactician',
  'mosje_drainer',
  'mosje_tuk_architect',
  'piecie_continuous_assault',
  'piecie_mp_hemorrhage',
  'piecie_perfect_setup',
  'piecie_double_trigger',
  'piecie_chain_reaction',
  'piecie_mp_amplifier',
  'piecie_synergy_field',
  'piecie_mosje_shield',
  'piecie_battle_concert',
  'snelle_perfect_dodge',
  'snelle_drain_reversal',
  'place_boxing_ring',
  'place_quest_haven',
  'place_drain_zone',
  'place_synergy_chamber'
];
