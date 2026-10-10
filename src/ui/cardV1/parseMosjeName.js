// parseMosjeName.js — split a Mosje name into { firstName, nickname }.
// Forms: "[First] Nickname" / "[...], The Hacker" (bracket form), and the 2.0
// comma form "Alyssa, The Bulldozer" (split at the FIRST ", "). A name without
// a comma ("FPS Coert") is all first name. Empty input -> 'Mosje'.
export function parseMosjeName(fullName) {
  const raw = String(fullName || '').trim();
  const end = raw.indexOf(']');
  if (raw.startsWith('[') && end > 0) {
    const rest = raw.slice(end + 1).trim().replace(/^,/, '').trim();
    return { firstName: raw.slice(1, end).trim(), nickname: rest };
  }
  const comma = raw.indexOf(', ');
  if (comma > 0) {
    return { firstName: raw.slice(0, comma).trim(), nickname: raw.slice(comma + 2).trim() };
  }
  return { firstName: raw || 'Mosje', nickname: '' };
}
