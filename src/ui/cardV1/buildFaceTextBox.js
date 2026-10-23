// buildFaceTextBox.js — the 2.0 frosted text box: one div per text line (ability name bold), then the
// Mosje's 3 level rows with the current level lit. '' when there is nothing to show.
// Every value goes through escapeHtml (formatAbilityLine escapes the text lines).
import { escapeHtml } from './escapeHtml.js';
import { formatAbilityLine } from './formatAbilityLine.js';

function buildLevelRow(row) {
  return `<div class="cv2-level-row" data-cv1-level-row="${escapeHtml(row.level)}" data-lit="${row.lit ? 'true' : 'false'}"><b>${escapeHtml(row.label)}</b> ${escapeHtml(row.text)}</div>`;
}

export function buildFaceTextBox(spec) {
  const lines = spec.lines || [];
  const rows = spec.levelRows || [];
  if (!lines.length && !rows.length) return '';
  const text = lines.length ? `<div class="cv2-text">${lines.map((l) => `<div>${formatAbilityLine(l)}</div>`).join('')}</div>` : '';
  const levels = rows.length ? `<div class="cv2-levels">${rows.map(buildLevelRow).join('')}</div>` : '';
  return `<div class="cv2-textbox">${text}${levels}</div>`;
}
