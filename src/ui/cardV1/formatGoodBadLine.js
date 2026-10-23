// formatGoodBadLine.js — "Good for: Fighting · Bad for: Digital, Artistic" for a Place (Phase 7 A6).
// The Card List words are printed exactly as written (no re-casing: "low-MP Mosjes", "Coert / Binti decks").
// An empty side is left out (nothing is invented); when both are empty the line is empty.
export function formatGoodBadLine(goodFor, badFor) {
  const parts = [];
  const good = Array.isArray(goodFor) ? goodFor.map(String) : [];
  const bad = Array.isArray(badFor) ? badFor.map(String) : [];
  if (good.length) parts.push(`Good for: ${good.join(', ')}`);
  if (bad.length) parts.push(`Bad for: ${bad.join(', ')}`);
  return parts.join(' · ');
}
