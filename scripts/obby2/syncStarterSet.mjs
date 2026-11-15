// Dev-only (Phase 69-01): sync the starter set of docs/obby-2.0/handover/cards.json into src/data.
// Usage: node scripts/obby2/syncStarterSet.mjs   (idempotent; never writes cards.json)
import { readFileSync, writeFileSync } from 'node:fs';
import { patchCard } from './patchCard.mjs';
import { toJsLiteral } from './toJsLiteral.mjs';

const J = JSON.parse(readFileSync('docs/obby-2.0/handover/cards.json', 'utf8'));
const FILES = { mosjes: 'src/data/mosjes.js', piecies: 'src/data/piecies.js', snelle: 'src/data/snellePiecies.js', places: 'src/data/places.js' };
const src = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, readFileSync(f, 'utf8')]));
const TRAIT = { Str: 'strength', Tech: 'technical', Art: 'artistic', Men: 'mental', Soc: 'social', Res: 'resilient' };
const stars = (n) => '★'.repeat(n);
const SLOT = { piecie: 'piecies', snelle: 'snelle', place: 'places' };
const TAGGED = ['food', 'gear', 'pet', 'substance'];

const parseRow = (row) => Object.fromEntries(row.replace(/^LV\d\s*/, '').split('·').map((p) => {
  const m = /^\s*(\w+)\s+(★+)\s*$/.exec(p);
  return [TRAIT[m[1]], m[2].length];
}));
const slug = (n) => n.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const eol = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

function patch(slot, id, fields) {
  const out = patchCard(src[slot], id, fields);
  if (out === null) throw new Error(`id ${id} not found in ${slot}`);
  src[slot] = out;
}

// 1. Mosjes
for (const m of J.mosjes.filter((x) => x.set === 'starter')) {
  const levels = m.traits.map((row, i) => ({ power: Number(m.power.split('/')[i]), traits: parseRow(row) }));
  patch('mosjes', m.dataId, {
    name: m.name, subtype: m.type.toUpperCase(), startMP: m.startMP, traits: levels[0].traits, abilityDescription: m.ability,
    cost: m.cost, levels, rarity: '★★★★',
  });
}

// 2. Existing starter cards
const starters = J.cards.filter((c) => c.starter === true || c.set === 'starter');
for (const c of starters.filter((x) => !x.isNew)) {
  const f = { name: c.name, description: c.text, cost: c.cost, rarity: stars(c.rarity) };
  if (c.kind === 'piecie') {
    f.tag = TAGGED.includes(c.subtype) ? c.subtype : null;
    f.piecieKind = c.subtype;
  }
  // givesMP is plainly wrong when the new text gives no MP at all (checked: no card gained MP without the flag)
  if (c.kind !== 'place' && !/(gains?|gives?) \d+ MP/.test(c.text)) f.givesMP = false;
  patch(SLOT[c.kind], c.dataId, f);
}

// 3. New cards
const placeholder = { piecie: 'assets/piecies/placeholder.png', snelle: 'assets/snelle-piecies/placeholder.png', place: 'assets/places/placeholder.png' };
const legacySubtype = { food: 'MOMENTUM-GAINING', gear: 'UTILITY', trick: 'UTILITY', substance: 'SUBSTANCE', pet: 'PET', attack: 'ATTACK' };
function newCard(c) {
  const id = `${c.kind}_${slug(c.name)}`;
  const effectId = `effect_${slug(c.name)}`;
  const base = { id };
  if (c.kind === 'piecie') {
    Object.assign(base, {
      type: 'PIECIE', subtype: legacySubtype[c.subtype], name: c.name, mpCost: 0, requirement: 'any', effectId,
      tags: [c.subtype.toUpperCase()], description: c.text, flavourText: '', cost: c.cost,
      tag: TAGGED.includes(c.subtype) ? c.subtype : null, group: null, stays: null, levelGate: null,
      limitPerDeck: c.rarity >= 5 ? 1 : 2, givesMP: /gains? \d+ MP/.test(c.text), piecieKind: c.subtype,
    });
  } else if (c.kind === 'snelle') {
    Object.assign(base, {
      type: 'SNELLE_PIECIE', subtype: 'INSTANT', name: c.name, mpCost: 0, requirement: 'any', effectId, tags: [],
      description: c.text, flavourText: '', cost: c.cost, costText: null, tag: null, stays: null, levelGate: null,
      limitPerDeck: c.rarity >= 5 ? 1 : 2, givesMP: /gains? \d+ MP/.test(c.text),
    });
  } else {
    Object.assign(base, {
      type: 'PLACE', name: c.name, trigger: 'PASSIVE', effectId, tags: [], description: c.text, flavourText: '',
      cost: c.cost, limitPerDeck: c.rarity >= 5 ? 1 : 2,
    });
  }
  Object.assign(base, { artPath: placeholder[c.kind], rarity: stars(c.rarity), isBoosterOnly: false });
  if (c.kind === 'place') Object.assign(base, { goodFor: [], badFor: [] });
  return base;
}
const pending = [];
for (const c of starters.filter((x) => x.isNew)) {
  const slot = SLOT[c.kind];
  const card = newCard(c);
  if (src[slot].includes(`id: "${card.id}"`)) { pending.push(card.effectId); continue; } // already added
  const e = eol(src[slot]);
  const lines = Object.entries(card).map(([k, v]) => `    ${k}: ${toJsLiteral(v)},`);
  const block = `  {${e}${lines.join(e)}${e}  },${e}`;
  const end = src[slot].lastIndexOf('];');
  src[slot] = src[slot].slice(0, end) + block + src[slot].slice(end);
  pending.push(card.effectId);
}

// 4. Archive (names -> ids from the current data; disabled: true, data kept)
const { PIECIES } = await import('../../src/data/piecies.js');
const { SNELLE_PIECIES } = await import('../../src/data/snellePiecies.js');
const { PLACES } = await import('../../src/data/places.js');
const where = [['piecies', PIECIES], ['snelle', SNELLE_PIECIES], ['places', PLACES]];
for (const name of J.dataCardsWithoutText) {
  const hit = where.map(([slot, list]) => [slot, list.find((x) => x.name === name)]).find(([, d]) => d);
  if (!hit) throw new Error(`archive: ${name} not found`);
  if (hit[1].disabled === true) continue; // already archived
  patch(hit[0], hit[1].id, { disabled: true });
}

for (const [k, f] of Object.entries(FILES)) writeFileSync(f, src[k]);
console.log('new effect ids:', pending.join(', '));
