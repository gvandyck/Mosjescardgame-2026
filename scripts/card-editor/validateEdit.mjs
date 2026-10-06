// validateEdit.mjs — only allow the two edits the card editor makes, in a strict format.
const ID = /^[A-Za-z0-9_-]{1,80}$/;
const RARITY = /^★{1,4}$/;
const FOCUS = /^\d{1,3}(\.\d{1,2})?% \d{1,3}(\.\d{1,2})?%$/;

export function validateEdit(edit) {
  if (!edit || typeof edit !== 'object' || !ID.test(edit.id || '')) return 'bad id';
  if (edit.rarity !== undefined && !RARITY.test(edit.rarity)) return 'bad rarity';
  if (edit.artFocus !== undefined && edit.artFocus !== '' && !FOCUS.test(edit.artFocus)) return 'bad artFocus';
  if (edit.rarity === undefined && edit.artFocus === undefined) return 'nothing to change';
  return null;
}
