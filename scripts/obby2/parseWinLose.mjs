// Dev-only: "+40 / −30" -> { win: 40, lose: -30 }; "+25 / —" or "can't fail" -> lose null.
export function parseWinLose(cell) {
  const [w, l = ''] = cell.split('/').map((s) => s.trim());
  const win = w.match(/^\+(\d+)$/);
  if (!win) throw new Error(`Unparseable win cell: "${cell}"`);
  const lose = l.match(/^[−-]\s*(\d+)$/);
  return { win: Number(win[1]), lose: lose ? -Number(lose[1]) : null };
}
