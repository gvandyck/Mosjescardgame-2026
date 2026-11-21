// expectQuestShuffledBack.js - Phase 72.1-02: 2.1 rule (rules.md section 6): after one attempt the Quest is shuffled back into its
// stack and a Quest is turned up (it may be the same one); no fail token. The stack keeps its number of Quests.
import { expect } from '@playwright/test';

const count = (st) => (st.deck?.length || 0) + (st.faceUp ? 1 : 0);

/** @param {object} before game state before the attempt @param {object} after game state after it @param {string} stack PHYSICAL | DIGITAL | CREATIVE */
export function expectQuestShuffledBack(before, after, stack) {
	const st = after.questStacks[stack];
	expect(st.faceUp, `${stack}: a Quest is face-up after the attempt`).toBeTruthy();
	expect(count(st), `${stack}: the stack still holds all its Quests`).toBe(count(before.questStacks[stack]));
	expect(st.tokens || 0, `${stack}: no fail token (tokens are gone)`).toBe(0);
}
