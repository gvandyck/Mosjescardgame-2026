// buildMosjeSpecV1.js — Mosje card -> 2.0 face spec (62-02 SPEC CONTRACT, consumed by buildPopupFace).
// Live state comes in on the card itself (boardRenderer / hoverZoom merge the slot): level (default 1),
// mp (default startMP), power (default levels[level - 1].power) and an optional tempMp (Tactician).
// Text = ability sentences, then the holder's "While ..." synergy text, or the "Synergy: ..." label when the
// Mosje has partners but no synergy text of its own. level (clamped 1..3) is also read by the field tile (buildFieldTile).
import { TYPE_COLORS } from './typeColors.js';
import { parseMosjeName } from './parseMosjeName.js';
import { splitSentences } from './splitSentences.js';
import { getMosjeTypeKey } from './getMosjeTypeKey.js';
import { formatEnergyCost } from './formatEnergyCost.js';
import { formatSynergyLabel } from './formatSynergyLabel.js';
import { getLevelRows } from './getLevelRows.js';

export function buildMosjeSpecV1(card) {
  const key = getMosjeTypeKey(card);
  const { firstName, nickname } = parseMosjeName(card.name);
  const lines = splitSentences(card.abilityDescription || card.description || '');
  if (card.synergyEffect) lines.push(String(card.synergyEffect));
  else if (formatSynergyLabel(card.synergyLabelText)) lines.push(formatSynergyLabel(card.synergyLabelText));
  const level = Math.max(1, Math.min(3, Number(card.level) || 1));
  const finite = (n) => (typeof n === 'number' && Number.isFinite(n) ? n : null);
  const power = finite(card.power) ?? finite(card.levels?.[level - 1]?.power) ?? 0;
  const mp = Number(card.mp ?? card.startMP ?? 0);
  const temp = finite(card.tempMp);
  return {
    face: 2,
    typeKey: 'MOSJE',
    colors: TYPE_COLORS[key],
    name: { first: firstName, nick: nickname },
    corner: { hook: 'cost', ...formatEnergyCost(card) },
    lines,
    levelRows: getLevelRows(card, level),
    info: '',
    pill: '',
    stays: false,
    label: '',
    footer: {
      left: { value: String(power), label: 'POWER', hook: 'power', hookValue: power },
      centre: { chip: `LVL ${level}`, label: `${key} MOSJE` },
      right: { value: String(temp ?? mp), label: 'MP', sub: temp === null ? '' : String(mp), hook: 'mp', hookValue: mp },
    },
    level,
    card,
    allowLarge: false,
  };
}
