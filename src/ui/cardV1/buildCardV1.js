// buildCardV1.js — entry point for the card frame v1 faces.
// Returns { html, className } for a supported card type, or null when the card
// type is not (yet) part of the v1 design and the old renderer should be used.
import { buildMosjeFaceV1 } from './buildMosjeFaceV1.js';
import { buildMosjeFieldV1 } from './buildMosjeFieldV1.js';

export function buildCardV1(card, { fieldMode = false } = {}) {
  const type = String(card.type || '').toUpperCase();
  if (type === 'MOSJE') {
    return {
      html: fieldMode ? buildMosjeFieldV1(card) : buildMosjeFaceV1(card),
      className: `card-v1 ${fieldMode ? 'card-v1--field' : 'card-v1--full'}`,
    };
  }
  return null;
}
