// Dev-only: one pipe table (array of lines) -> array of row objects keyed by header cell.
export function parseMarkdownTable(lines) {
  const cells = (line) => line.split('|').slice(1, -1).map((s) => s.trim());
  const header = cells(lines[0]);
  const rows = [];
  for (const line of lines.slice(1)) {
    const c = cells(line);
    if (c.every((x) => /^:?-+:?$/.test(x))) continue; // separator row
    const row = {};
    header.forEach((h, i) => { row[h] = c[i] ?? ''; });
    rows.push(row);
  }
  return rows;
}
