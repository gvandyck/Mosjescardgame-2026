// buildQuestSpecV1.js — Quest card -> face spec (rose). Name only, "Category · Difficulty"
// info line, QUEST/PERSONAL pill, fail penalty as border text, success MP badge.
import { TYPE_COLORS } from './typeColors.js';
import { splitSentences } from './splitSentences.js';

function titleCase(word) {
  const w = String(word || '');
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

export function buildQuestSpecV1(card) {
  const pill = card.questType === 'PERSONAL' ? 'PERSONAL QUEST' : 'QUEST';
  const fail = Number(card.failMP);
  return {
    colors: TYPE_COLORS.QUEST,
    name: { first: String(card.name || 'Quest'), nick: '' },
    lines: splitSentences(card.description || card.requirementDescription || ''),
    info: [card.category, titleCase(card.difficulty)].filter(Boolean).join(' · '),
    pill,
    fieldPill: 'QUEST',
    borderText: Number.isFinite(fail) && fail !== 0 ? `Fail: ${fail < 0 ? '−' : '+'}${Math.abs(fail)} MP` : 'Quest',
    badge: Number.isFinite(Number(card.successMP)) ? { value: `+${Number(card.successMP)}`, label: 'SUCCESS', fieldLabel: 'MP' } : null,
    card,
    infoInRow: true, // category/difficulty sits on the pill row, clear of the description plate
    allowLarge: true,
    fieldArtPos: '50% 50%',
  };
}
