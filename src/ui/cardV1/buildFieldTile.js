// buildFieldTile.js — the 2.0 field tile (240 x 176 reference, any size) for every card type, from a face spec
// (62-UI-SPEC "Field tile"; Phase 7 A3 field tile, A4 STAYS on the field, A7 Quest tile with 2 fail pips).
// Art window + the two fades (no tier chrome, no shine), name (+ nickname) on one line, then per type:
// Mosje / Quest = number zones (buildFieldTileStats); Piecie / Snelle / Place = type pill + STAYS chip when the card stays.
// No tile shows a cost (already paid). Root hooks: data-cv1-tier. Styling: styles/card-face-2-0.css (.cv2-tile-*).
import { escapeHtml } from './escapeHtml.js';
import { buildArtLayer } from './buildArtLayer.js';
import { buildQuestArt } from './buildQuestArt.js';
import { buildFieldTileStats } from './buildFieldTileStats.js';

const FADES = '<div class="cv1-fade cv1-fade--bottom"></div><div class="cv1-fade cv1-fade--top"></div>';

function buildPills(spec) {
  if (!spec.pill) return '';
  const stays = spec.stays ? '<span class="cv2-chip" data-cv1-stays="true">STAYS</span>' : '';
  return `<div class="cv2-tile-pills"><span class="cv2-pill">${escapeHtml(spec.pill)}</span>${stays}</div>`;
}

export function buildFieldTile(spec, { tier = 4 } = {}) {
  const { colors, name, card, typeKey } = spec;
  const art = buildArtLayer(card) || (typeKey === 'QUEST' ? buildQuestArt() : '');
  const artVar = spec.fieldArtPos ? `;--cv1-field-art-pos:${escapeHtml(spec.fieldArtPos)}` : '';
  const nick = name.nick ? `<span class="cv2-nick">${escapeHtml(name.nick)}</span>` : '';
  const numbers = buildFieldTileStats(spec);
  return `
    <div class="cv1-face cv1-face--2 cv2-tile" data-cv1-tier="${escapeHtml(tier)}" style="--cv1-main:${escapeHtml(colors.main)};--cv1-tint:${escapeHtml(colors.tint)}${artVar}">
      <div class="cv1-window">${art}${FADES}</div>
      <div class="cv2-tile-name"><span class="cv2-first">${escapeHtml(name.first)}</span>${nick}</div>
      ${numbers || buildPills(spec)}
    </div>`;
}
