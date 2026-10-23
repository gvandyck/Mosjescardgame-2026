// getQuestNeed.js — the dice need printed top-left on a 2.0 Quest (Phase 7 A7, D-08, D-11).
// Read from the band table (QUEST_BANDS[band].needs, which equals the Card List), never hard-coded per quest:
// one-success bands (Steady, Prepared, Gated) show the plain number "4+", two-success bands "2× 4+" / "2× 5+",
// Coin flip "4+" under COIN, Trained "★★" under TRAINED. An unknown band returns null (no corner).
import { QUEST_BANDS } from '../../data/questBands.js';

export function getQuestNeed(quest) {
  const needs = QUEST_BANDS[quest?.band]?.needs;
  if (!needs) return null;
  if (quest.band === 'trained') {
    const stars = needs.match(/★+/)?.[0];
    return stars ? { hook: 'need', value: stars, label: 'TRAINED' } : null;
  }
  if (quest.band === 'coin_flip') {
    const min = needs.match(/(\d)\+/)?.[1];
    return min ? { hook: 'need', value: `${min}+`, label: 'COIN' } : null;
  }
  const m = needs.match(/\b(one|two)\s+(\d)\+/);
  if (!m) return null;
  return { hook: 'need', value: m[1] === 'two' ? `2× ${m[2]}+` : `${m[2]}+`, label: 'NEED' };
}
