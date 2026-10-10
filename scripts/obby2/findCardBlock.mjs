// Dev-only: locate a card's text block in a data file. Mirrors scripts/card-editor/patchCardSource.mjs.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findCardBlock(source, id) {
  const m = new RegExp(`^([ \\t]*)id:\\s*(["'])${escapeRe(id)}\\2`, 'm').exec(source);
  if (!m) return null;
  const from = m.index + m[0].length;
  const rest = source.slice(from);
  const next = new RegExp(`\\r?\\n${m[1]}id:\\s*["']`).exec(rest);
  return { start: m.index, end: from + (next ? next.index : rest.length), indent: m[1] };
}
