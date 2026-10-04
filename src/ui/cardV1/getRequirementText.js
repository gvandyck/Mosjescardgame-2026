// getRequirementText.js — "Requires: ..." text for a Piecie/Snelle requirement code.
// Codes in the data: any, level1, level2, mental2, mental3, physical2, bankChilling.
const NAMED = { bankChilling: 'Bank Chilling active' };

export function getRequirementText(code) {
  const raw = String(code || 'any');
  if (raw === 'any') return 'Any';
  if (NAMED[raw]) return NAMED[raw];
  const level = raw.match(/^level(\d+)$/);
  if (level) return `Lvl ${level[1]}+`;
  const trait = raw.match(/^([a-z]+?)(\d+)$/);
  if (trait) {
    const stars = Number(trait[2]);
    const name = `${trait[1].charAt(0).toUpperCase()}${trait[1].slice(1)}`;
    return `${name} ${'★'.repeat(stars)}${stars < 3 ? '+' : ''}`;
  }
  return raw;
}
