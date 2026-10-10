// Dev-only: Example Decks markdown -> 3 deck objects.
import { parseMarkdownTable } from './parseMarkdownTable.mjs';

export function parseExampleDecks(md) {
  const decks = [];
  let deck = null;
  let table = null;
  const flush = () => {
    if (deck && table) {
      deck.entries = parseMarkdownTable(table)
        .filter((r) => !r['#'].startsWith('**'))
        .map((r) => ({
          qty: Number(r['#']),
          name: r.Card.replace(/\s*\*\(start\)\*/, ''),
          kind: r.Kind,
          cost: r.Cost,
        }));
    }
    table = null;
  };
  for (const line of md.split('\n')) {
    const h = line.match(/^## Deck \d+ — (\w+) · "(.+)"$/);
    if (h) {
      flush();
      deck = {
        key: h[2].toLowerCase(), kind: h[1].toUpperCase(), name: h[2],
        description: '', startingMosjeName: '', entries: [],
      };
      decks.push(deck);
      continue;
    }
    if (line.startsWith('## ')) { flush(); deck = null; continue; }
    if (!deck) continue;
    if (line.startsWith('|')) { (table ??= []).push(line); continue; }
    flush();
    const s = line.match(/^\*\*Starting Mosje:\*\*\s*(.+)$/);
    if (s) deck.startingMosjeName = s[1].trim();
    else if (!deck.description && line.trim() && !line.startsWith('**')) deck.description = line.trim();
  }
  flush();
  return decks;
}
