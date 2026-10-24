// buildFieldTileStats.js — the number zones of a 2.0 field tile (Phase 7 A3 / A7), from a face spec.
// MOSJE: L<n> chip (data-cv1-level; Level 3 reads "LVL 3 · HOLD"), POWER box left (data-cv1-power), MP box right (data-cv1-mp; a Tactician temp MP is
// shown big with the real MP small under it, and the hook keeps the REAL MP). QUEST: need block, WIN left, LOSE right,
// and exactly 2 fail pips (filled = fail tokens, clamped to 0..2). Other types have no number zones ('').
// Every interpolated value goes through escapeHtml. Styling: styles/card-face-2-0.css (.cv2-tile-*).
import { escapeHtml } from './escapeHtml.js';

function buildStat(stat, side) {
  if (!stat) return '';
  const hook = stat.hook ? ` data-cv1-${escapeHtml(stat.hook)}="${escapeHtml(stat.hookValue ?? '')}"` : '';
  const sub = stat.sub ? `<div class="cv2-tile-sub">${escapeHtml(stat.sub)}</div>` : '';
  const label = stat.label ? `<div class="cv2-tile-label">${escapeHtml(stat.label)}</div>` : '';
  const word = stat.word ? ' cv2-tile-stat--word' : ''; // a word instead of a number ("can't fail")
  return `<div class="cv2-tile-stat cv2-tile-stat--${side}${word}"${hook}><div class="cv2-tile-val">${escapeHtml(stat.value)}</div>${sub}${label}</div>`;
}

function buildNeed(corner) {
  if (!corner) return '';
  return `<div class="cv2-tile-need" data-cv1-need="${escapeHtml(corner.value)}"><div class="cv2-tile-val">${escapeHtml(corner.value)}</div><div class="cv2-tile-label">${escapeHtml(corner.label)}</div></div>`;
}

function buildPips(failTokens) {
  const filled = Math.max(0, Math.min(2, Math.floor(Number(failTokens) || 0)));
  const pip = (state) => `<i class="cv2-pip" data-cv1-pip="${state}"></i>`;
  return `<div class="cv2-tile-pips">${pip(filled >= 1 ? 'filled' : 'empty')}${pip(filled >= 2 ? 'filled' : 'empty')}</div>`;
}

export function buildFieldTileStats(spec) {
  if (spec.typeKey === 'MOSJE') {
    const level = escapeHtml(String(spec.level));
    const chip = Number(spec.level) === 3 ? 'LVL 3 · HOLD' : `L${level}`; // Level 3 holds: the owner wins at their next turn start (D-17)
    return `<div class="cv2-tile-lvl" data-cv1-level="${level}">${chip}</div>${buildStat(spec.footer?.left, 'left')}${buildStat(spec.footer?.right, 'right')}`;
  }
  if (spec.typeKey === 'QUEST') {
    return `${buildNeed(spec.corner)}${buildStat(spec.footer?.left, 'left')}${buildStat(spec.footer?.right, 'right')}${buildPips(spec.failTokens)}`;
  }
  return '';
}
