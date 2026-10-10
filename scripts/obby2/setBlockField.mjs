// Dev-only: set one single-line property in a card block (replace in place, or insert before artPath).
import { toJsLiteral } from './toJsLiteral.mjs';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function setBlockField(block, indent, eol, key, value, comment) {
  if (key !== 'rarity' && /rarity$/i.test(key)) throw new Error(`setBlockField: key ${key} must not end in rarity`);
  const line = `${indent}${key}: ${toJsLiteral(value)},${comment ? ` // ${comment}` : ''}`;
  const lineRe = new RegExp(`^${escapeRe(indent)}${escapeRe(key)}:[^\\r\\n]*`, 'm');
  const existing = lineRe.exec(block);
  if (existing) {
    if (!/,\s*(\/\/.*)?$/.test(existing[0])) {
      const id = /id:\s*["']([^"']+)/.exec(block)?.[1];
      throw new Error(`setBlockField: value of ${key} in ${id} is not single-line`);
    }
    return block.slice(0, existing.index) + line + block.slice(existing.index + existing[0].length);
  }
  const artRe = new RegExp(`^${escapeRe(indent)}artPath:`, 'm');
  const art = artRe.exec(block);
  if (!art) throw new Error(`setBlockField: no artPath line to insert ${key} before`);
  return block.slice(0, art.index) + line + eol + block.slice(art.index);
}
