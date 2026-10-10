// Dev-only CLI: node scripts/obby2/applyHiddenFlags.mjs  (idempotent)
// Sets `disabled: true` on the 15 HIDDEN_CARD_IDS and un-hides mosje_drainer.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HIDDEN_CARD_IDS } from './hiddenCardIds.mjs';
import { findCardBlock } from './findCardBlock.mjs';

const FILES = { mosje_: 'mosjes.js', piecie_: 'piecies.js', place_: 'places.js', quest_: 'quests.js' };
const dataFile = (name) => fileURLToPath(new URL(`../../src/data/${name}`, import.meta.url));


function setDisabled(src, id) {
  const b = findCardBlock(src, id);
  if (!b) throw new Error(`card ${id} not found`);
  const block = src.slice(b.start, b.end);
  if (/^\s*disabled:\s*true/m.test(block)) return null;
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  // The block runs from `id:` to the next `id:`, so it contains this card's closing brace line.
  // Insert `disabled: true` after the last property, before that closing brace.
  const closeIndent = b.indent.slice(2); // card braces sit 2 spaces left of the `id:` property
  const close = block.search(new RegExp('\\r?\\n' + closeIndent + '\\}'));
  if (close < 0) throw new Error(`no closing brace found for ${id}`);
  const prev = block.slice(0, close).replace(/,?[ \t]*$/, ',');
  return src.slice(0, b.start) + prev + eol + `${b.indent}disabled: true` + block.slice(close) + src.slice(b.end);
}

const sources = {};
const read = (f) => (sources[f] ??= fs.readFileSync(dataFile(f), 'utf8'));
let changed = 0;

for (const id of HIDDEN_CARD_IDS) {
  const f = Object.entries(FILES).find(([p]) => id.startsWith(p))[1];
  const next = setDisabled(read(f), id);
  if (next) { sources[f] = next; changed++; console.log(`hid ${id}`); }
}

// Un-hide Drainer: remove the comment lines + disabled line and the trailing comma before them.
{
  const src = read('mosjes.js');
  const b = findCardBlock(src, 'mosje_drainer');
  let block = src.slice(b.start, b.end);
  const re = /,(\r?\n[ \t]*\/\/[^\r\n]*)+\r?\n[ \t]*disabled: true/;
  if (re.test(block)) {
    block = block.replace(re, '');
    sources['mosjes.js'] = src.slice(0, b.start) + block + src.slice(b.end);
    changed++;
    console.log('unhid mosje_drainer');
  }
}

for (const [f, s] of Object.entries(sources)) fs.writeFileSync(dataFile(f), s);
console.log(`changed ${changed}`);
