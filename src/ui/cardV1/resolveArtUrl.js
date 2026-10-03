// resolveArtUrl.js — turn a card artPath into a loadable <img> URL, or '' when
// the card has no real art (empty or the shared placeholder).
export function resolveArtUrl(artPath) {
  const raw = String(artPath || '').trim();
  if (!raw || raw.endsWith('/placeholder.png')) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (typeof window === 'undefined') return raw;
  const base = raw.startsWith('/') ? window.location.origin : window.location.href;
  return new URL(raw, base).toString();
}
