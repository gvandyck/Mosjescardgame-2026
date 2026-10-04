// buildFaceV1.js — card frame v1 full (pop-up) face, built from a face spec:
// { colors, name:{first,nick}, lines[], info, pill, borderText, badge|null, card, allowLarge }
// badge: { value, label, word } — word=true for "Free" (smaller type). Place has no badge.
import { escapeHtml } from './escapeHtml.js';
import { formatAbilityLine } from './formatAbilityLine.js';
import { fitFirstName } from './fitFirstName.js';
import { getDescriptionLayout } from './getDescriptionLayout.js';
import { buildArtLayer } from './buildArtLayer.js';

export function buildFaceV1(spec) {
  const { colors, name, lines, info, pill, borderText, badge, card, allowLarge } = spec;
  const layout = getDescriptionLayout(lines, { allowLarge, minFade: allowLarge ? 250 : 380 });
  const vars = `--cv1-main:${colors.main};--cv1-tint:${colors.tint};--cv1-name-size:${fitFirstName(name.first)};--cv1-desc-size:${layout.size};--cv1-fade:${layout.fade}`;
  const badgeHtml = badge
    ? `<div class="cv1-badge"><div class="cv1-badge-val${badge.word ? ' cv1-badge-val--word' : ''}" data-cv1-mp>${escapeHtml(badge.value)}</div><div class="cv1-badge-label">${escapeHtml(badge.label)}</div></div>`
    : '';

  return `
    <div class="cv1-face${badge ? '' : ' cv1-face--no-badge'}" style="${vars}"${layout.overflow ? ' data-cv1-overflow="true"' : ''}>
      <i class="cv1-stripe cv1-stripe--l"></i><i class="cv1-stripe cv1-stripe--r"></i>
      <i class="cv1-diamond cv1-diamond--a"></i><i class="cv1-diamond cv1-diamond--b"></i><i class="cv1-diamond cv1-diamond--c"></i>
      <div class="cv1-window">${buildArtLayer(card)}<div class="cv1-fade cv1-fade--bottom"></div><div class="cv1-fade cv1-fade--top"></div></div>
      <div class="cv1-name"><div class="cv1-first">${escapeHtml(name.first)}</div>${name.nick ? `<div class="cv1-nick">${escapeHtml(name.nick)}</div>` : ''}</div>
      <div class="cv1-desc">${lines.map((l) => `<div>${formatAbilityLine(l)}</div>`).join('')}</div>
      <div class="cv1-info">${escapeHtml(info)}</div>
      <div class="cv1-pill-row"><span class="cv1-pill">${escapeHtml(pill)}</span></div>
      <div class="cv1-border-text">${escapeHtml(borderText)}</div>
      ${badgeHtml}
    </div>`;
}
