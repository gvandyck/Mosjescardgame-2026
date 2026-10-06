// saveEdit.js — send one edit (rarity and/or artFocus) to the local card editor helper.
// Resolves { ok, file } or { ok:false, error }.
export async function saveEdit(edit) {
  try {
    const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
    return await res.json();
  } catch {
    return { ok: false, error: 'helper not running - start it with: npm run card-editor' };
  }
}
