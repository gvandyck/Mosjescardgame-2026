// Dev-only: apply fields to one card block of a data-file source. Returns new source, or null if id absent.
import { findCardBlock } from './findCardBlock.mjs';
import { setBlockField } from './setBlockField.mjs';

export function patchCard(source, id, fields, comments = {}) {
  const b = findCardBlock(source, id);
  if (!b) return null;
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  let block = source.slice(b.start, b.end);
  for (const [key, value] of Object.entries(fields)) {
    block = setBlockField(block, b.indent, eol, key, value, comments[key]);
  }
  return source.slice(0, b.start) + block + source.slice(b.end);
}
