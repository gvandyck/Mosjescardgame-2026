// buildFaceStack.js — the 2.0 bottom stack, one column anchored to the bottom of the face:
// text box (passed in), then the optional info line, type pill (+ STAYS chip), label and footer.
// A zone with no content is not rendered at all (a Piecie with no needsText has no info line).
// Every value goes through escapeHtml.
import { escapeHtml } from './escapeHtml.js';

function buildStat(stat, side) {
  if (!stat) return `<div class="cv2-footer-gap cv2-footer-gap--${side}"></div>`;
  const hook = stat.hook ? ` data-cv1-${escapeHtml(stat.hook)}="${escapeHtml(stat.hookValue ?? '')}"` : '';
  const sub = stat.sub ? `<div class="cv2-stat-sub">${escapeHtml(stat.sub)}</div>` : '';
  return `<div class="cv2-stat cv2-stat--${side}"${hook}><div class="cv2-stat-val">${escapeHtml(stat.value)}</div>${sub}<div class="cv2-stat-label">${escapeHtml(stat.label)}</div></div>`;
}

function buildFooter(footer) {
  const c = footer.centre;
  const centre = c ? `<div class="cv2-footer-centre"><div class="cv2-lvl-chip">${escapeHtml(c.chip)}</div><div class="cv2-lvl-label">${escapeHtml(c.label)}</div></div>` : '<div class="cv2-footer-centre"></div>';
  return `<div class="cv2-footer">${buildStat(footer.left, 'left')}${centre}${buildStat(footer.right, 'right')}</div>`;
}

export function buildFaceStack(spec, textBoxHtml) {
  const info = spec.info ? `<div class="cv2-info">${escapeHtml(spec.info)}</div>` : '';
  const stays = spec.stays ? `<span class="cv2-chip" data-cv1-stays="true">STAYS</span>` : '';
  const pills = spec.pill ? `<div class="cv2-pills"><span class="cv2-pill">${escapeHtml(spec.pill)}</span>${stays}</div>` : '';
  const label = spec.label ? `<div class="cv2-label">${escapeHtml(spec.label)}</div>` : '';
  const footer = spec.footer ? buildFooter(spec.footer) : '';
  return `<div class="cv2-stack">${textBoxHtml}${info}${pills}${label}${footer}</div>`;
}
