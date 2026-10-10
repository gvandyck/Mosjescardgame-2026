// Dev-only: "L1: Power 10 · Phys ★★ · Res ★<br>L2: ..." -> [{ power, traits }] x3.
const TRAIT = {
  Phys: 'physical', Men: 'mental', Soc: 'social',
  Cre: 'creative', Tech: 'technical', Res: 'resilient',
};

export function parseLevelCell(cell) {
  return cell.split('<br>').map((seg) => {
    const m = seg.trim().match(/^L(\d): Power (\d+)(.*)$/);
    if (!m) throw new Error(`Unparseable level segment: "${seg}"`);
    const traits = {};
    for (const part of m[3].split('·').map((x) => x.trim()).filter(Boolean)) {
      const t = part.match(/^(\w+) (★+)$/);
      if (!t || !TRAIT[t[1]]) throw new Error(`Unparseable trait "${part}" in "${seg}"`);
      traits[TRAIT[t[1]]] = t[2].length;
    }
    return { power: Number(m[2]), traits };
  });
}
