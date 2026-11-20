// buildTagLinesHtml.js — up to max tag lines, then one "+N more" line.
import { escapeHtml } from '../cardV1/escapeHtml.js';
import { CHIP_KINDS } from './chipKinds.js';

export function buildTagLinesHtml(lines, { max = 2 } = {}) {
  const list = Array.isArray(lines) ? lines : [];
  if (list.length === 0) return '';
  const rows = list.slice(0, max).map(({ text, kind }) => {
    const key = Object.prototype.hasOwnProperty.call(CHIP_KINDS, kind) ? kind : 'neutral';
    const style = `--chip-main:${CHIP_KINDS[key].main};--chip-tint:${CHIP_KINDS[key].tint}`;
    return `<div class="tag-line tag-line--${key}" style="${style}">${escapeHtml(text)}</div>`;
  });
  const hidden = list.length - rows.length;
  if (hidden > 0) rows.push(`<div class="tag-line tag-line--more">+${hidden} more</div>`);
  return `<div class="tag-lines">${rows.join('')}</div>`;
}
