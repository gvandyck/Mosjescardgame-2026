// patchCardSource.mjs — pure text edit of a card data file (src/data/*.js).
// Changes `rarity` and/or `artFocus` of the card with the given id and leaves everything else as is.
// Returns the new source, or null when the id is not in this source.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function cardBlock(source, id) {
  const m = new RegExp(`^([ \\t]*)id:\\s*(["'])${escapeRe(id)}\\2`, 'm').exec(source);
  if (!m) return null;
  const rest = source.slice(m.index + m[0].length);
  const next = new RegExp(`\\n${m[1]}id:\\s*["']`).exec(rest); // next card at the same indent
  const end = m.index + m[0].length + (next ? next.index : rest.length);
  return { start: m.index, end, indent: m[1] };
}

function setRarity(block, indent, rarity) {
  const re = /(\brarity:\s*)(["'])[^"'\n]*\2/;
  if (re.test(block)) return block.replace(re, `$1"${rarity}"`);
  return block.replace(/^([^\n]*\n)/, `$1${indent}rarity: "${rarity}",\n`);
}

function setArtFocus(block, indent, focus) {
  const lineRe = /^[ \t]*artFocus:[^\n]*\n/m;
  if (!focus) return block.replace(lineRe, '');
  if (lineRe.test(block)) return block.replace(/(\bartFocus:\s*)(["'])[^"'\n]*\2/, `$1"${focus}"`);
  if (/^[ \t]*artPath:/m.test(block)) return block.replace(/^([ \t]*)artPath:/m, `$1artFocus: "${focus}",\n$1artPath:`);
  return block.replace(/^([^\n]*\n)/, `$1${indent}artFocus: "${focus}",\n`);
}

export function patchCardSource(source, id, { rarity, artFocus } = {}) {
  const b = cardBlock(source, id);
  if (!b) return null;
  let block = source.slice(b.start, b.end);
  if (rarity !== undefined) block = setRarity(block, b.indent, rarity);
  if (artFocus !== undefined) block = setArtFocus(block, b.indent, artFocus);
  return source.slice(0, b.start) + block + source.slice(b.end);
}
