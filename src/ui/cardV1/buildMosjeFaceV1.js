// buildMosjeFaceV1.js — card frame v1, full (pop-up) face for a Mosje.
import { escapeHtml } from './escapeHtml.js';
import { TYPE_COLORS } from './typeColors.js';
import { parseMosjeName } from './parseMosjeName.js';
import { splitSentences } from './splitSentences.js';
import { formatTraitsLine } from './formatTraitsLine.js';
import { formatAbilityLine } from './formatAbilityLine.js';
import { fitFirstName } from './fitFirstName.js';
import { getDescriptionLayout } from './getDescriptionLayout.js';
import { buildArtLayer } from './buildArtLayer.js';
import { getMosjeTypeKey } from './getMosjeTypeKey.js';

export function buildMosjeFaceV1(card) {
  const key = getMosjeTypeKey(card);
  const colors = TYPE_COLORS[key];
  const { firstName, nickname } = parseMosjeName(card.name);
  const lines = splitSentences(card.abilityDescription || card.description || '');
  if (card.synergyEffect) lines.push(String(card.synergyEffect));
  const layout = getDescriptionLayout(lines);
  const level = (Number.isFinite(Number(card.level)) ? Number(card.level) : 0) + 1;
  const mp = Number(card.mp ?? card.startMP ?? 0);
  const typeLabel = `${key.charAt(0)}${key.slice(1).toLowerCase()} Mosje`;
  const vars = `--cv1-main:${colors.main};--cv1-tint:${colors.tint};--cv1-name-size:${fitFirstName(firstName)};--cv1-desc-size:${layout.size};--cv1-fade:${layout.fade}`;

  return `
    <div class="cv1-face" style="${vars}"${layout.overflow ? ' data-cv1-overflow="true"' : ''}>
      <i class="cv1-stripe cv1-stripe--l"></i><i class="cv1-stripe cv1-stripe--r"></i>
      <i class="cv1-diamond cv1-diamond--a"></i><i class="cv1-diamond cv1-diamond--b"></i><i class="cv1-diamond cv1-diamond--c"></i>
      <div class="cv1-window">${buildArtLayer(card)}<div class="cv1-fade cv1-fade--bottom"></div><div class="cv1-fade cv1-fade--top"></div></div>
      <div class="cv1-name"><div class="cv1-first">${escapeHtml(firstName)}</div>${nickname ? `<div class="cv1-nick">${escapeHtml(nickname)}</div>` : ''}</div>
      <div class="cv1-desc">${lines.map((l) => `<div>${formatAbilityLine(l)}</div>`).join('')}</div>
      <div class="cv1-info">${escapeHtml(formatTraitsLine(card.traits))}</div>
      <div class="cv1-pill-row"><span class="cv1-pill">LVL ${level}</span></div>
      <div class="cv1-border-text">${escapeHtml(typeLabel)}</div>
      <div class="cv1-badge"><div class="cv1-badge-val" data-cv1-mp>${mp}</div><div class="cv1-badge-label">MP</div></div>
    </div>`;
}
