// Dev-only: one readable string for a Quest row (Quests have no free-text column in the Card List).
export function composeQuestText(row, bands) {
  const band = bands[row.band];
  const label = row.band.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const parts = [`${label} (${band.needs}).`, `Rolls: ${row.rolls}.`];
  if (row.costText) parts.push(`First you must: ${row.costText}.`);
  const lose = row.lose === null ? "Lose: can't fail" : `Lose ${row.lose}`;
  parts.push(`Win +${row.win} / ${lose}.`);
  if (row.extras) parts.push(`Also: ${row.extras}`);
  return parts.join(' ').replace(/−/g, '-');
}
