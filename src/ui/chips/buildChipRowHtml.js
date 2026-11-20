// buildChipRowHtml.js — a row of chips, with "+N more" when there are more than max.
import { escapeHtml } from '../cardV1/escapeHtml.js';
import { buildChipHtml } from './buildChipHtml.js';

export function buildChipRowHtml(chips, { max = 3 } = {}) {
  const list = Array.isArray(chips) ? chips : [];
  if (list.length === 0) return '';
  const shown = list.slice(0, max).map(buildChipHtml).join('');
  const hidden = list.slice(max);
  const more = hidden.length
    ? `<span class="chip chip--more" title="${escapeHtml(hidden.map(c => c.label).join(', '))}">+${hidden.length} more</span>`
    : '';
  return `<div class="chip-row">${shown}${more}</div>`;
}
