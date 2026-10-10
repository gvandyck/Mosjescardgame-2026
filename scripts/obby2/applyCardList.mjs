// Dev-only CLI: node scripts/obby2/applyCardList.mjs <mosjes|piecies|snelle|quests|places>
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readDoc } from './readDoc.mjs';
import { parseCardList } from './parseCardList.mjs';
import { CARD_ID_MAP } from './cardIdMap.mjs';
import { patchCard } from './patchCard.mjs';
import { FOIL_MOSJE_IDS } from './foilMosjeIds.mjs';

const FILES = {
  mosjes: 'mosjes.js', piecies: 'piecies.js', snelle: 'snellePiecies.js',
  quests: 'quests.js', places: 'places.js',
};

export async function applyCardList(type) {
  if (!FILES[type]) throw new Error(`unknown type ${type}`);
  const Type = type[0].toUpperCase() + type.slice(1);
  const mod = await import(`./build${Type}Fields.mjs`);
  const build = mod[`build${Type}Fields`];
  const parsed = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
  const file = fileURLToPath(new URL(`../../src/data/${FILES[type]}`, import.meta.url));
  let src = fs.readFileSync(file, 'utf8');
  const missing = [];
  let patched = 0;
  const rowIds = new Set();
  for (const row of parsed[type]) {
    const id = CARD_ID_MAP[type][row.name];
    rowIds.add(id);
    const { fields, comments } = build(row, id, parsed);
    const out = patchCard(src, id, fields, comments);
    if (out === null) missing.push(id); else { src = out; patched++; }
  }
  if (type === 'mosjes') {
    for (const id of FOIL_MOSJE_IDS.filter((i) => !rowIds.has(i))) {
      const out = patchCard(src, id, { foil: true });
      if (out === null) missing.push(id); else src = out;
    }
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log(`patched ${patched} / missing ${JSON.stringify(missing)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await applyCardList(process.argv[2]);
}
