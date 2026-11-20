// getTraitWord.js — the short on-card name of a trait (D-10): Str / Tech / Art / Soc / Men / Res.
// An unknown trait is title-cased.
const WORDS = {
  strength: 'Str', technical: 'Tech', artistic: 'Art', social: 'Soc', mental: 'Men', resilient: 'Res',
};

export function getTraitWord(trait) {
  const key = String(trait || '').toLowerCase();
  if (WORDS[key]) return WORDS[key];
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}
