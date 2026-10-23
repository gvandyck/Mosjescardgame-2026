// buildPopupFace.js — the 2.0 pop-up / hand face (Phase 7 A2), built from a 2.0 face spec
// (see buildMosjeSpecV1) and the frame tier: { tier, layout: 'fullart' | 'boxed', diamonds }.
// Layers: tier chrome, art window (+ tier 5 shine / tier 3 foil), cost or need corner, divider, name,
// then the bottom stack (frosted text box, info, pill, label, footer). Root hooks: data-cv1-tier,
// data-cv1-foil, data-cv1-clamped ('true' only when the text had to be clamped).
// Styling: styles/card-face-2-0.css. Every interpolated value goes through escapeHtml.
import { escapeHtml } from './escapeHtml.js';
import { fitFirstName } from './fitFirstName.js';
import { buildArtLayer } from './buildArtLayer.js';
import { buildQuestArt } from './buildQuestArt.js';
import { buildTierChrome } from './buildTierChrome.js';
import { buildShineLayers } from './buildShineLayers.js';
import { buildBoxedLayers } from './buildBoxedLayers.js';
import { buildFoilLayers } from './buildFoilLayers.js';
import { getTierFadeHeight } from './getTierFadeHeight.js';
import { getTextBoxLayout } from './getTextBoxLayout.js';
import { resolveTintAlpha } from './resolveTintAlpha.js';
import { TEXTBOX_TINT_ALPHA } from './faceTokens.js';
import { buildFaceTextBox } from './buildFaceTextBox.js';
import { buildFaceStack } from './buildFaceStack.js';

const FADES = '<div class="cv1-fade cv1-fade--bottom"></div><div class="cv1-fade cv1-fade--top"></div>';

function buildCorner(corner) {
  if (!corner) return '';
  const sub = corner.sub ? `<div class="cv2-corner-sub">${escapeHtml(corner.sub)}</div>` : '';
  return `<div class="cv2-corner" data-cv1-${escapeHtml(corner.hook)}="${escapeHtml(corner.value)}"><div class="cv2-corner-val">${escapeHtml(corner.value)}</div><div class="cv2-corner-label">${escapeHtml(corner.label)}</div>${sub}</div><i class="cv2-divider"></i>`;
}

export function buildPopupFace(spec, { tier = 4, layout = 'fullart', diamonds = tier } = {}) {
  const { colors, name, card, typeKey } = spec;
  const fullArt = layout !== 'boxed';
  const text = getTextBoxLayout({ lines: spec.lines, levelRowCount: spec.levelRows?.length ?? 0, layout, info: spec.info });
  const nameSize = typeKey === 'MOSJE' ? fitFirstName(name.first, 36, 22, 280) : 28;
  const fade = getTierFadeHeight({ typeKey, lines: spec.lines });
  const vars = `--cv1-main:${escapeHtml(colors.main)};--cv1-tint:${escapeHtml(colors.tint)};--cv1-tint-alpha:${resolveTintAlpha(TEXTBOX_TINT_ALPHA)};--cv1-text-size:${text.size};--cv1-name-size:${nameSize};--cv1-fade:${fade}`;
  const foil = !fullArt && tier === 3 ? buildFoilLayers() : null;
  // A Quest without real art shows the stack-colour seigaiha + die placeholder (D-08).
  const art = buildArtLayer(card) || (typeKey === 'QUEST' ? buildQuestArt() : '');
  const windowInner = fullArt
    ? `${art}${FADES}${tier === 5 ? buildShineLayers() : ''}`
    : `${art}${foil ? foil.window : ''}`;
  const chrome = fullArt ? buildTierChrome(diamonds) : buildBoxedLayers(tier, diamonds);
  const nick = name.nick ? `<div class="cv2-nick">${escapeHtml(name.nick)}</div>` : '';
  return `
    <div class="cv1-face cv1-face--2" style="${vars}" data-cv1-tier="${escapeHtml(tier)}" data-cv1-foil="${tier === 5 ? 'true' : 'false'}"${text.clamped ? ' data-cv1-clamped="true"' : ''}>
      ${chrome}
      <div class="cv1-window">${windowInner}</div>${foil ? foil.frame : ''}
      ${buildCorner(spec.corner)}
      <div class="cv2-name${typeKey === 'MOSJE' ? '' : ' cv2-name--wrap'}"><div class="cv2-first">${escapeHtml(name.first)}</div>${nick}</div>
      ${buildFaceStack(spec, buildFaceTextBox(spec))}
    </div>`;
}
