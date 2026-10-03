// parseMosjeName.js — split "[First] Nickname" into { firstName, nickname }.
// The first name is the text inside the leading brackets (it may itself contain
// quotes or slashes); the nickname is the rest, trimmed. Either may be empty.
export function parseMosjeName(fullName) {
  const raw = String(fullName || '');
  const end = raw.indexOf(']');
  if (raw.startsWith('[') && end > 0) {
    return { firstName: raw.slice(1, end).trim(), nickname: raw.slice(end + 1).trim() };
  }
  return { firstName: raw.trim() || 'Mosje', nickname: '' };
}
