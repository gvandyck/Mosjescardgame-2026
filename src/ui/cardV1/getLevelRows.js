// getLevelRows.js — the 3 Mosje level rows "Power 10 · Phys ★★ · Res ★" with the current level lit (D-06).
const ABBR = {
  physical: 'Phys', mental: 'Men', social: 'Soc', creative: 'Cre', technical: 'Tech', resilient: 'Res',
};

function rowText(level) {
  let text = `Power ${level.power}`;
  for (const [trait, stars] of Object.entries(level.traits || {})) {
    if (stars > 0 && ABBR[trait]) text += ` · ${ABBR[trait]} ${'★'.repeat(stars)}`;
  }
  return text;
}

export function getLevelRows(card, level = 1) {
  if (!Array.isArray(card?.levels) || card.levels.length !== 3) return [];
  const lit = Math.min(3, Math.max(1, Math.round(Number(level)) || 1));
  return card.levels.map((lv, i) => ({
    level: i + 1, label: `L${i + 1}`, text: rowText(lv), lit: i + 1 === lit,
  }));
}
