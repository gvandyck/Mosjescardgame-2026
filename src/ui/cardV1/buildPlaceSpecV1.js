// buildPlaceSpecV1.js — Place card -> face spec (violet). Name only, "Good for / Bad for"
// info line, PLACE pill, "Only 1 active at a time" border text, NO badge.
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';
import { formatAffinityLine } from './formatAffinityLine.js';

export function buildPlaceSpecV1(card) {
  return {
    colors: TYPE_COLORS.PLACE,
    name: { first: String(card.name || 'Place'), nick: '' },
    lines: splitSentences(card.description || ''),
    info: formatAffinityLine(card.goodFor, card.badFor),
    pill: 'PLACE',
    fieldPill: 'PLACE',
    borderText: 'Only 1 active at a time',
    badge: null,
    card,
    allowLarge: true,
    fieldArtPos: '50% 55%',
  };
}
