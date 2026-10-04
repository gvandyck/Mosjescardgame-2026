// buildCardV1.js — entry point for the card frame v1 faces.
// Returns { html, className } for a supported card type, or null when the card
// type is not (yet) part of the v1 design and the old renderer should be used.
import { buildFaceV1 } from './buildFaceV1.js';
import { buildFieldFaceV1 } from './buildFieldFaceV1.js';
import { buildMosjeSpecV1 } from './buildMosjeSpecV1.js';
import { buildPiecieSpecV1 } from './buildPiecieSpecV1.js';
import { buildSnelleSpecV1 } from './buildSnelleSpecV1.js';
import { buildPlaceSpecV1 } from './buildPlaceSpecV1.js';

const SPEC_BUILDERS = {
  MOSJE: buildMosjeSpecV1,
  PIECIE: buildPiecieSpecV1,
  SNELLE_PIECIE: buildSnelleSpecV1,
  PLACE: buildPlaceSpecV1,
};

export function buildCardV1(card, { fieldMode = false } = {}) {
  const buildSpec = SPEC_BUILDERS[String(card.type || '').toUpperCase()];
  if (!buildSpec) return null;
  const spec = buildSpec(card);
  return {
    html: fieldMode ? buildFieldFaceV1(spec) : buildFaceV1(spec),
    className: `card-v1 ${fieldMode ? 'card-v1--field' : 'card-v1--full'}`,
  };
}
