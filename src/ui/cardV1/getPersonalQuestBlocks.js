// getPersonalQuestBlocks.js — the labelled blocks of a Personal Quest face (Phase 72-02, D-01).
// [{ key, label, text }] in the order Needs, Pay, Roll. The text is the printed needsText / payText / rollText,
// never rebuilt from the structured fields; a missing (null / empty) line leaves its block out.
const BLOCKS = [
  { key: 'needs', label: 'Needs', field: 'needsText' },
  { key: 'pay', label: 'Pay', field: 'payText' },
  { key: 'roll', label: 'Roll', field: 'rollText' },
];

export function getPersonalQuestBlocks(card) {
  return BLOCKS
    .filter((b) => typeof card?.[b.field] === 'string' && card[b.field] !== '')
    .map((b) => ({ key: b.key, label: b.label, text: card[b.field] }));
}
