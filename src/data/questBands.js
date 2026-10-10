// Phase 53: 2.0 Quest band table (pure data). Source: Card List "Quests" band table.
export const QUEST_BANDS = {
  steady: { needs: 'one 4+', win: 25, lose: -15 },
  skilled: { needs: 'two 4+', win: 40, lose: -30 },
  heroic: { needs: 'two 5+', win: 60, lose: -25 },
  prepared: { needs: 'pay first, then one 4+', win: 50, lose: -30 },
  gated: { needs: 'a board or MP condition, then one 4+', win: 35, lose: -20 },
  coin_flip: { needs: 'no trait, roll 1 die: 4+', win: 50, lose: -25 },
  trained: { needs: 'trait ★★ or more, no roll', win: 25, lose: null },
};
