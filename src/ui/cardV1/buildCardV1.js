// buildCardV1.js — entry point for the card frame v1 faces.
// Returns { html, className } for a supported card type, or null when the card
// has no v1 face (an unknown type, or a V4 Quest without a stack) and the old renderer should be used.
// A spec with face === 2 is built by the shared 2.0 pop-up face (buildPopupFace); every card type is on it now.
// fieldMode builds the 2.0 field tile (buildFieldTile) for every type.
import { buildFaceV1 } from './buildFaceV1.js';
import { buildPopupFace } from './buildPopupFace.js';
import { buildFieldTile } from './buildFieldTile.js';
import { buildMosjeSpecV1 } from './buildMosjeSpecV1.js';
import { buildPiecieSpecV1 } from './buildPiecieSpecV1.js';
import { buildSnelleSpecV1 } from './buildSnelleSpecV1.js';
import { buildPlaceSpecV1 } from './buildPlaceSpecV1.js';
import { buildQuestSpecV1 } from './buildQuestSpecV1.js';
import { getTierAttributes } from './getTierAttributes.js';

const SPEC_BUILDERS = {
  MOSJE: buildMosjeSpecV1,
  PIECIE: buildPiecieSpecV1,
  SNELLE_PIECIE: buildSnelleSpecV1,
  PLACE: buildPlaceSpecV1,
  QUEST: buildQuestSpecV1,
};

function buildPopupHtml(spec, tierAttrs) {
  if (spec.face === 2) return buildPopupFace(spec, tierAttrs);
  return buildFaceV1(spec, { tier: tierAttrs.tier, layoutEnabled: tierAttrs.enabled, diamonds: tierAttrs.diamonds });
}

export function buildCardV1(card, { fieldMode = false } = {}) {
  const buildSpec = SPEC_BUILDERS[String(card.type || '').toUpperCase()];
  if (!buildSpec) return null;
  const spec = buildSpec(card);
  if (!spec) return null; // e.g. a leftover V4 Quest without a stack: the unified template draws it
  const tierAttrs = getTierAttributes(card);
  return {
    html: fieldMode ? buildFieldTile(spec, tierAttrs) : buildPopupHtml(spec, tierAttrs),
    className: `card-v1 ${fieldMode ? 'card-v1--field' : 'card-v1--full'} ${tierAttrs.classes}`,
    tier: tierAttrs.tier,
    dataTier: String(tierAttrs.tier),
    diamonds: tierAttrs.diamonds,
  };
}
