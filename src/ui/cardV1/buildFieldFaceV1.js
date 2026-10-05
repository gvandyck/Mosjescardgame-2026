// buildFieldFaceV1.js — card frame v1 field tile (240x176), built from a face spec.
// Art, name (+ nickname) on one line, small pill, small badge (none for Place).
import { escapeHtml } from './escapeHtml.js';
import { buildArtLayer } from './buildArtLayer.js';
import { formatAbilityLine } from './formatAbilityLine.js';

export function buildFieldFaceV1(spec) {
  const { colors, name, fieldPill, badge, card, fieldArtPos, lines } = spec;
  const first = Array.isArray(lines) && lines.length ? String(lines[0]) : '';
  const fieldDesc = first ? `<div class="cv1-fdesc">${formatAbilityLine(first)}</div>` : '';
  const artVar = fieldArtPos ? `;--cv1-field-art-pos:${fieldArtPos}` : '';
  const badgeHtml = badge
    ? `<div class="cv1-badge"><div class="cv1-badge-val${badge.word ? ' cv1-badge-val--word' : ''}" data-cv1-mp>${escapeHtml(badge.value)}</div><div class="cv1-badge-label">${escapeHtml(badge.fieldLabel || badge.label)}</div></div>`
    : '';
  return `
    <div class="cv1-face" style="--cv1-main:${colors.main};--cv1-tint:${colors.tint}${artVar}">
      <div class="cv1-window">${buildArtLayer(card)}<div class="cv1-fade cv1-fade--bottom"></div><div class="cv1-fade cv1-fade--top"></div>
        <div class="cv1-name"><span class="cv1-first">${escapeHtml(name.first)}</span>${name.nick ? `<span class="cv1-nick">${escapeHtml(name.nick)}</span>` : ''}</div>
        ${fieldDesc}
        <div class="cv1-pill-row"><span class="cv1-pill">${escapeHtml(fieldPill)}</span></div>
      </div>
      ${badgeHtml}
    </div>`;
}
