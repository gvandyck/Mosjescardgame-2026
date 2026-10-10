// Dev-only CLI: node scripts/obby2/addNewQuests.mjs -- insert the 2 new Quest blocks (idempotent).
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toJsLiteral } from './toJsLiteral.mjs';
import { NEW_QUEST_BLOCKS } from './newQuestBlocks.mjs';

export function addNewQuests() {
  const file = fileURLToPath(new URL('../../src/data/quests.js', import.meta.url));
  let src = fs.readFileSync(file, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  let added = 0;
  for (const q of NEW_QUEST_BLOCKS) {
    if (src.includes(`id: "${q.id}"`)) continue;
    const props = Object.entries(q).map(([k, v], i, a) => `    ${k}: ${toJsLiteral(v)}${i < a.length - 1 ? ',' : ''}`);
    const block = `  {${eol}${props.join(eol)}${eol}  }`;
    const close = src.lastIndexOf('];');
    const before = src.slice(0, close);
    const head = before.replace(/\}(\s*)$/, (m, ws) => `},${eol}${block}${ws}`);
    if (head === before) throw new Error('could not find QUESTS array end');
    src = head + src.slice(close);
    added++;
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log(`added ${added}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) addNewQuests();
