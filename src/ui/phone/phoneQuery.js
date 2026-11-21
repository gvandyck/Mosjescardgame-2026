// phoneQuery.js — the ONE phone breakpoint in JS (Phase 65, D-02). The phone layout switches on by viewport WIDTH, not by "touch
// device", so a narrow desktop window can test it. 700 px: portrait phones (360-430 px) and nothing wider, aligned with the
// reaction-sheet rule in board-actions.css (plan 08 moves that one to 700). Every phone rule in styles/phone-*.css sits behind
// the same literal; tests/ui/phone-breakpoint.test.ts keeps the two in step.
export const PHONE_QUERY = '(max-width: 700px)';
