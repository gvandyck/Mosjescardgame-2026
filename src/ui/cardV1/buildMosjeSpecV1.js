// buildMosjeSpecV1.js — Mosje card -> face spec. Badge = live MP (or printed Start MP
// when the card has no live state, e.g. in hand); pill = current level; info = traits.
import { TYPE_COLORS } from './typeColors.js';
import { parseMosjeName } from './parseMosjeName.js';
import { splitSentences } from './splitSentences.js';
import { formatTraitsLine } from './formatTraitsLine.js';
import { getMosjeTypeKey } from './getMosjeTypeKey.js';

export function buildMosjeSpecV1(card) {
  const key = getMosjeTypeKey(card);
  const { firstName, nickname } = parseMosjeName(card.name);
  const lines = splitSentences(card.abilityDescription || card.description || '');
  if (card.synergyEffect) lines.push(String(card.synergyEffect));
  const level = (Number.isFinite(Number(card.level)) ? Number(card.level) : 0) + 1;
  const mp = Number(card.mp ?? card.startMP ?? 0);
  return {
    colors: TYPE_COLORS[key],
    name: { first: firstName, nick: nickname },
    lines,
    info: formatTraitsLine(card.traits),
    pill: `LVL ${level}`,
    fieldPill: `L${level}`,
    borderText: `${key.charAt(0)}${key.slice(1).toLowerCase()} Mosje`,
    badge: { value: String(mp), label: 'MP' },
    card,
    allowLarge: false,
  };
}
