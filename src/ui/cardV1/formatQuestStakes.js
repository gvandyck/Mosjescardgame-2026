// formatQuestStakes.js — the WIN / LOSE numbers in the footer of a 2.0 Quest (Phase 7 A7).
// value = what is printed ("+40", "−30" with U+2212), hookValue = what the test hook carries (40, -30).
// A Trained Quest has no lose value: it prints "can't fail" and its hook value is 'none'.
export function formatQuestStakes(quest) {
  const win = Number(quest?.win) || 0;
  const lose = quest?.lose;
  const noLose = lose === null || lose === undefined;
  return {
    win: { value: `+${win}`, hookValue: win },
    lose: noLose
      ? { value: "can't fail", hookValue: 'none' }
      : { value: `${Number(lose) < 0 ? '−' : '+'}${Math.abs(Number(lose))}`, hookValue: Number(lose) },
  };
}
