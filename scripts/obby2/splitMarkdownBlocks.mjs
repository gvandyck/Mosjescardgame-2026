// Dev-only: find every pipe table with its h2/h3 heading and the paragraph line just above it.
// Stops before "## Not in 2.0" so parked/cut cards are never parsed.
export function splitMarkdownBlocks(md) {
  const blocks = [];
  let h2 = '';
  let h3 = '';
  let lead = '';
  let current = null;
  for (const line of md.split('\n')) {
    if (line.startsWith('## Not in 2.0')) break;
    if (line.startsWith('|')) {
      if (!current) {
        current = { h2, h3, lead, lines: [] };
        blocks.push(current);
      }
      current.lines.push(line);
      continue;
    }
    current = null;
    if (line.startsWith('### ')) { h3 = line.slice(4).trim(); lead = ''; }
    else if (line.startsWith('## ')) { h2 = line.slice(3).trim(); h3 = ''; lead = ''; }
    else if (line.trim() && !line.startsWith('#') && line.trim() !== '---') lead = line.trim();
  }
  return blocks;
}
