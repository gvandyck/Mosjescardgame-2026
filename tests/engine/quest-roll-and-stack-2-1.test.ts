// @ts-nocheck
// 70-02 (rules §6): a Quest roll uses at most 6 dice; a Quest leaves its stack after one attempt, win or fail.
import { describe, it, expect } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { getQuestDiceCount } from "../../src/engine/quests/getQuestDiceCount.js";
import { MAX_QUEST_DICE } from "../../src/engine/quests/questRules.js";
import { advanceQuestStack } from "../../src/engine/quests/advanceQuestStack.js";
import { buildQuestStacks } from "../../src/engine/setup/buildQuestStacks.js";
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
import { resolveQuestAttempt } from "../../src/engine/quests/resolveQuestAttempt.js";
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";

const quest = { rollTrait: "strength" };
const slotWith = (stars: number) => {
	const s = createMosjeSlot(MOSJES[0], { level: 1, mp: 30 });
	s.entryProtected = false;
	s.traits = { strength: stars, mental: 1, artistic: 1, technical: 1, resilient: 1, social: 1 };
	return s;
};
const count = (stars: number, extra = 0) => {
	const st = makeEngineState({ players: { player_1: { activeSlots: [slotWith(stars), null] } } });
	return getQuestDiceCount(st, "player_1", st.players.player_1.activeSlots[0], quest, { extra });
};
const spyShuffle = () => {
	const calls: string[][] = [];
	const fn = (cards: string[]) => { calls.push([...cards]); return [...cards].reverse(); };
	return { fn, calls };
};
const stateWith = (stack: any) => ({ questStacks: { PHYSICAL: stack } });

describe("Quest dice cap (rules §6)", () => {
	it("is 6", () => expect(MAX_QUEST_DICE).toBe(6));
	it("3 stars + 1 extra = 4, 5 stars + 1 = 6, never above 6, 0 stars = 1", () => {
		expect(count(3, 1)).toBe(4);
		expect(count(5, 1)).toBe(6);
		expect(count(5, 5)).toBe(6);
		expect(count(3, 5)).toBe(6);
		expect(count(3, 9)).toBe(6);
		expect(count(0)).toBe(1);
	});
});

describe("advanceQuestStack: one attempt per Quest (rules §6)", () => {
	for (const outcome of ["win", "fail"]) {
		it(`after a ${outcome} the Quest is shuffled back, a card is face-up, no tokens`, () => {
			const { fn, calls } = spyShuffle();
			const s = stateWith({ deck: ["b", "c"], faceUp: "a", discard: [] });
			advanceQuestStack(s, "PHYSICAL", outcome, fn);
			const stack = s.questStacks.PHYSICAL;
			expect(calls).toHaveLength(1);
			expect(calls[0].sort()).toEqual(["a", "b", "c"]); // the old face-up card went back into the deck before the shuffle
			expect(stack.faceUp).not.toBeNull();
			expect(stack.tokens).toBeUndefined();
			expect(stack.discard).toEqual([]);
			expect(stack.deck.length + 1).toBe(3);
			expect([...stack.deck, stack.faceUp].sort()).toEqual(["a", "b", "c"]);
		});
	}
	it("the number of cards stays the same over many attempts", () => {
		const s = stateWith({ deck: ["b", "c", "d"], faceUp: "a", discard: [] });
		for (let i = 0; i < 20; i++) advanceQuestStack(s, "PHYSICAL", i % 2 ? "win" : "fail");
		const st = s.questStacks.PHYSICAL;
		expect(st.deck.length + (st.faceUp ? 1 : 0)).toBe(4);
		expect([...st.deck, st.faceUp].sort()).toEqual(["a", "b", "c", "d"]);
	});
	it("a stack with one single Quest turns that same Quest up again", () => {
		const s = stateWith({ deck: [], faceUp: "a", discard: [] });
		advanceQuestStack(s, "PHYSICAL", "fail");
		expect(s.questStacks.PHYSICAL).toEqual({ deck: [], faceUp: "a", discard: [] });
	});
	it("an empty stack stays empty", () => {
		const s = stateWith({ deck: [], faceUp: null, discard: [] });
		advanceQuestStack(s, "PHYSICAL", "win");
		expect(s.questStacks.PHYSICAL.faceUp).toBeNull();
	});
	it("buildQuestStacks makes stacks without tokens", () => {
		const stacks = buildQuestStacks([{ id: "q1", stack: "PHYSICAL" }, { id: "q2", stack: "PHYSICAL" }], (c: any) => c);
		expect(stacks.PHYSICAL).toEqual({ deck: ["q2"], faceUp: "q1", discard: [] });
	});
});

describe("resolveQuestAttempt on a failed roll", () => {
	it("leaves a face-up Quest at once that the next Mosje can attempt", () => {
		const q = getQuestDef("quest_tough_it_out");
		const stacks: any = {};
		for (const id of ["PHYSICAL", "DIGITAL", "CREATIVE"]) stacks[id] = { deck: ["quest_improvise"], faceUp: "quest_tough_it_out", discard: [] };
		stacks[q.stack] = { deck: ["quest_improvise"], faceUp: q.id, discard: [] };
		const s = makeEngineState({ questStacks: stacks, players: { player_1: { activeSlots: [slotWith(1), slotWith(1)] }, player_2: { activeSlots: [slotWith(1), null] } } });
		const r = rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: q.stack, rng: () => 0.0 });
		expect(r.pending.win).toBe(false);
		const out = resolveQuestAttempt(r.state, r.pending);
		expect(out.ok).toBe(true);
		const stack = out.state.questStacks[q.stack];
		expect(stack.faceUp).not.toBeNull();
		expect(stack.tokens).toBeUndefined();
		const again = rollQuestAttempt(out.state, "player_1", { slotIndex: 1, stackId: q.stack, rng: () => 0.9 });
		expect(again.ok, again.error).toBe(true);
	});
});
