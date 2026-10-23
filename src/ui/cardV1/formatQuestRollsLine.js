// formatQuestRollsLine.js — the info line of a 2.0 Quest: "Rolls: <trait> · <band>" (Phase 7 A7).
// The trait part is the Card List "Rolls" cell: the trait name, "Mosje's best trait", "no trait" (Coin flip and
// other trait-less rolls) or "no roll" (Trained, which never rolls).
const BAND_LABELS = {
  steady: 'Steady', skilled: 'Skilled', heroic: 'Heroic', prepared: 'Prepared',
  gated: 'Gated', coin_flip: 'Coin flip', trained: 'Trained',
};

const titleCase = (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;

export function formatQuestRollsLine(quest) {
  const trait = String(quest?.rollTrait || 'none');
  let rolls;
  if (trait === 'best') rolls = "Mosje's best trait";
  else if (trait === 'none') rolls = quest?.band === 'trained' ? 'no roll' : 'no trait';
  else rolls = titleCase(trait);
  const band = BAND_LABELS[quest?.band];
  return band ? `Rolls: ${rolls} · ${band}` : `Rolls: ${rolls}`;
}
