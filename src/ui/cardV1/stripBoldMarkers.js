// stripBoldMarkers.js — the plain-text form of a card text: drops the ** bold markers (titles, tooltips, list rows).
export function stripBoldMarkers(text) {
  return String(text ?? '').replace(/\*\*/g, '');
}
