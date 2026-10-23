// getQuestTextLines.js — the text box lines of a 2.0 Quest: "First you must: <costText>" first (only when the
// Quest has a cost), then the Also text split at sentence breaks. The markdown bold markers in the data
// ("**Vraag Aad:**") are removed as text only; the wording is never changed and nothing becomes HTML.
import { splitSentences } from './splitSentences.js';

export function getQuestTextLines(quest) {
  const lines = [];
  if (quest?.costText) lines.push(`First you must: ${quest.costText}`);
  if (quest?.extras) lines.push(...splitSentences(String(quest.extras).replace(/\*\*/g, '')));
  return lines;
}
