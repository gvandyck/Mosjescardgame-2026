// formatAbilityLine.js — one description line as HTML, ability name in bold.
// "Unstoppable (comeback): this Mosje ..." -> "<b>Unstoppable (comeback):</b> this Mosje ..."
// Formatting only: the text itself is never changed.
import { escapeHtml } from './escapeHtml.js';

export function formatAbilityLine(line) {
  const text = String(line || '');
  // "While X is on your field:" is a condition, not an ability name.
  const match = /^While /.test(text) ? null : text.match(/^([^:.]{1,40}:)(\s.*)$/);
  if (!match) return escapeHtml(text);
  return `<b>${escapeHtml(match[1])}</b>${escapeHtml(match[2])}`;
}
