// buildMosjeFieldV1.js — card frame v1, field tile (240x176) for a Mosje:
// art, name + nickname on one line, small level pill, small MP badge.
import { escapeHtml } from './escapeHtml.js';
import { TYPE_COLORS } from './typeColors.js';
import { parseMosjeName } from './parseMosjeName.js';
import { buildArtLayer } from './buildArtLayer.js';
import { getMosjeTypeKey } from './getMosjeTypeKey.js';

export function buildMosjeFieldV1(card) {
  const colors = TYPE_COLORS[getMosjeTypeKey(card)];
  const { firstName, nickname } = parseMosjeName(card.name);
  const level = (Number.isFinite(Number(card.level)) ? Number(card.level) : 0) + 1;
  const mp = Number(card.mp ?? card.startMP ?? 0);

  return `
    <div class="cv1-face" style="--cv1-main:${colors.main};--cv1-tint:${colors.tint}">
      <div class="cv1-window">${buildArtLayer(card)}<div class="cv1-fade cv1-fade--bottom"></div><div class="cv1-fade cv1-fade--top"></div>
        <div class="cv1-name"><span class="cv1-first">${escapeHtml(firstName)}</span>${nickname ? `<span class="cv1-nick">${escapeHtml(nickname)}</span>` : ''}</div>
        <div class="cv1-pill-row"><span class="cv1-pill">L${level}</span></div>
      </div>
      <div class="cv1-badge"><div class="cv1-badge-val" data-cv1-mp>${mp}</div><div class="cv1-badge-label">MP</div></div>
    </div>`;
}
