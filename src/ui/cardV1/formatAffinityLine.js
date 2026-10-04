// formatAffinityLine.js — "Good for: Fighting · Bad for: Digital" for a Place.
// Built from the card goodFor / badFor arrays. An empty side is left out (nothing is
// invented); when both are empty the line is empty.
const titleCase = (value) => `${String(value).charAt(0).toUpperCase()}${String(value).slice(1).toLowerCase()}`;

export function formatAffinityLine(goodFor, badFor) {
  const parts = [];
  const good = (Array.isArray(goodFor) ? goodFor : []).map(titleCase);
  const bad = (Array.isArray(badFor) ? badFor : []).map(titleCase);
  if (good.length) parts.push(`Good for: ${good.join(', ')}`);
  if (bad.length) parts.push(`Bad for: ${bad.join(', ')}`);
  return parts.join(' · ');
}
