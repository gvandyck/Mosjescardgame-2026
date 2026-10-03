// formatTraitsLine.js — "Physical ★★★ · Social ★★★ · Resilient ★★" for the info line.
// Only traits with at least one star are listed; filled stars only (no empty pips).
export function formatTraitsLine(traits) {
  return Object.entries(traits || {})
    .filter(([, stars]) => Number(stars) > 0)
    .map(([trait, stars]) => `${trait.charAt(0).toUpperCase()}${trait.slice(1)} ${'★'.repeat(Number(stars))}`)
    .join(' · ');
}
