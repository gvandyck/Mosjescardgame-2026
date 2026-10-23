// splitNeedsLead.js — drop the leading "Needs: X." / "Only if X:" / "Only if X." from a Piecie/Snelle
// text, because the info line already shows it (D-03, D-12). Formatting only: one capital changes.
export function splitNeedsLead(description, needsText) {
  const text = String(description ?? '');
  const n = String(needsText ?? '');
  if (!n) return text;
  for (const prefix of [`Needs: ${n}.`, `Only if ${n}:`, `Only if ${n}.`]) {
    if (!text.startsWith(prefix)) continue;
    const rest = text.slice(prefix.length).trimStart();
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : text;
  }
  return text;
}
