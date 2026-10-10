// Dev-only: Card List markdown -> { mosjes, quests, piecies, snelle, places, bands }.
import { splitMarkdownBlocks } from './splitMarkdownBlocks.mjs';
import { parseMarkdownTable } from './parseMarkdownTable.mjs';
import { parseLevelCell } from './parseLevelCell.mjs';
import { parseWinLose } from './parseWinLose.mjs';

const DASH = '—';
const strip = (s) => s.replace(/\*\*/g, '').trim();
const orNull = (s) => (s === DASH || s === '' ? null : s);
const bandId = (s) => s.toLowerCase().replace(/\s+/g, '_');

function intCost(cell, name) {
  const n = Number(cell);
  if (!Number.isInteger(n)) throw new Error(`Non-integer cost "${cell}" on ${name}`);
  return n;
}

function parseAbilities(cell) {
  const abilities = [];
  let holderText = null;
  for (const seg of cell.split('<br>').map((s) => s.trim())) {
    if (seg.startsWith('**While ')) { holderText = strip(seg); continue; }
    const m = seg.match(/^\*\*(.+?)\*\*\s*—\s*(.*)$/);
    if (!m) throw new Error(`Unparseable ability segment: "${seg}"`);
    abilities.push({ name: m[1], text: m[2].trim() });
  }
  return { abilities, holderText };
}

function mosjeRow(r, section) {
  const name = r.Mosje.replace(/\s*\*\(name owed\)\*/, '');
  return {
    name, section, cost: intCost(r.Cost, name), rarity: r.Rarity,
    startMP: intCost(r['Start MP'], name), levels: parseLevelCell(r['Level rows']),
    ...parseAbilities(r.Ability), synergyCell: orNull(r.Synergy),
  };
}

function piecieRow(r, h3, lead) {
  const name = r.Piecie;
  const kind = r.Kind.split('·').map((s) => s.trim())[1] ?? null;
  const textKey = Object.keys(r).find((k) => k.startsWith('Text'));
  let text = strip(r[textKey]);
  if (kind === 'pet') text = `${strip(lead.replace(/^[^*]*/, ''))} ${text}`;
  const group = h3.startsWith('MP ') ? 'mp' : h3.startsWith('Attack') ? 'attack'
    : h3.startsWith('Utility') ? 'utility' : null;
  return { name, group, tag: kind, cost: intCost(r.Cost, name), rarity: r.Rarity, text };
}

function snelleRow(r) {
  const name = r.Snelle;
  const costText = r.Cost === '4 or free' ? r.Cost : null;
  const cost = costText ? 4 : intCost(r.Cost, name);
  return { name, cost, costText, rarity: r.Rarity, text: strip(r.Text) };
}

function placeRow(r) {
  const list = (s) => (s === DASH ? [] : s.split(', ').map((x) => x.trim()));
  return {
    name: r.Place, cost: intCost(r.Cost, r.Place), rarity: r.Rarity, text: strip(r.Text),
    goodFor: list(r['Good for']), badFor: list(r['Bad for']),
  };
}

function questRow(r, stack) {
  const v = Object.values(r); // Quest, Band, Rolls, First you must..., Win / Lose, Also
  return {
    name: v[0], stack, band: bandId(v[1]), rolls: v[2], costText: orNull(v[3]),
    ...parseWinLose(v[4]), extras: orNull(v[5]),
  };
}

export function parseCardList(md) {
  const out = { mosjes: [], quests: [], piecies: [], snelle: [], places: [], bands: {} };
  for (const { h2, h3, lead, lines } of splitMarkdownBlocks(md)) {
    const rows = parseMarkdownTable(lines);
    if (h2 === 'Mosjes') {
      out.mosjes.push(...rows.map((r) => mosjeRow(r, h3.toUpperCase())));
    } else if (h2 === 'Quests' && !h3) {
      for (const r of rows) {
        const [band, needs, wl] = Object.values(r);
        out.bands[bandId(band)] = { needs, ...parseWinLose(wl) };
      }
    } else if (h2 === 'Quests') {
      const stack = h3.split(' ')[0].toUpperCase();
      out.quests.push(...rows.map((r) => questRow(r, stack)));
    } else if (h2 === 'Piecies') {
      out.piecies.push(...rows.map((r) => piecieRow(r, h3, lead)));
    } else if (h2.startsWith('Snelle')) {
      out.snelle.push(...rows.map(snelleRow));
    } else if (h2.startsWith('Places')) {
      out.places.push(...rows.map(placeRow));
    }
  }
  return out;
}
