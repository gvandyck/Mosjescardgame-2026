// buildPlaceSpecV1.js — Place card -> 2.0 face spec (62-02 SPEC CONTRACT, consumed by buildPopupFace; violet).
// Corner = Energy cost (0 stays "0"). Info line = "Good for: X · Bad for: Y" with the Card List words as written.
// Pill PLACE, label "Only 1 in play", no footer. fieldPill + badge only feed the legacy field tile (until 62-05).
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';
import { formatGoodBadLine } from './formatGoodBadLine.js';
import { formatEnergyCost } from './formatEnergyCost.js';

export function buildPlaceSpecV1(card) {
  return {
    face: 2,
    typeKey: 'PLACE',
    colors: TYPE_COLORS.PLACE,
    name: { first: String(card.name || 'Place'), nick: '' },
    corner: { hook: 'cost', ...formatEnergyCost(card) },
    lines: splitSentences(card.description || ''),
    levelRows: [],
    info: formatGoodBadLine(card.goodFor, card.badFor),
    pill: 'PLACE',
    stays: false,
    label: 'Only 1 in play',
    footer: null,
    fieldPill: 'PLACE',
    badge: null,
    card,
    allowLarge: true,
    fieldArtPos: '50% 55%',
  };
}
