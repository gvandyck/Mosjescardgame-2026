// @ts-nocheck
// E17 / E18 - the 2.0 Quest attempt (rollQuestAttempt -> resolveQuestAttempt) + the +1 die rules.
import { describe, it, expect } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { PIECIES } from "../../src/data/piecies.js";
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
import { resolveQuestAttempt } from "../../src/engine/quests/resolveQuestAttempt.js";
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";

const ONE = { physical: 1, mental: 1, creative: 1, technical: 1, resilient: 1, social: 1 };
const HIGH = 0.7; // d6 = 5
const LOW = 0.2; // d6 = 2
const rngOf = (v) => () => v;
const gear = PIECIES.find(p => p.tag === "gear").id;
const noRng = () => { throw new Error("rng must not be called"); };

function mkSlot(over = {}) {
  const s = createMosjeSlot(MOSJES[0], { level: 1, mp: 30 });
  s.entryProtected = false;
  s.traits = { ...ONE };
  return Object.assign(s, over);
}
function build(questName, { slot = {}, p1 = {}, second = null } = {}) {
  const q = getQuestDef("quest_" + questName);
  const stacks = {};
  for (const id of ["FIGHTING", "DIGITAL", "ARTISTIC"]) stacks[id] = { deck: ["quest_filler"], faceUp: "quest_tough_it_out", tokens: 0, discard: [] };
  stacks[q.stack] = { deck: ["quest_filler"], faceUp: q.id, tokens: 0, discard: [] };
  const s = makeEngineState({
    questStacks: stacks,
    players: {
      player_1: { activeSlots: [mkSlot(slot), second], ...p1 },
      player_2: { activeSlots: [mkSlot(), null] },
    },
  });
  return { s, q };
}
const go = (s, q, o = {}) => rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: q.stack, rng: rngOf(HIGH), ...o });

describe("Quest attempt end to end (E17)", () => {
  it("Steady win: +25, Quest replaced, action used", () => {
    const { s, q } = build("tough_it_out");
    const r = go(s, q);
    expect(r.ok).toBe(true);
    expect(r.pending.dice).toEqual([5]);
    const out = resolveQuestAttempt(r.state, r.pending);
    expect(out.ok).toBe(true);
    expect(out.state.players.player_1.activeSlots[0].mp).toBe(55);
    expect(out.state.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
    expect(out.state.questStacks[q.stack].faceUp).toBe("quest_filler");
    expect(out.state.questStacks[q.stack].discard).toEqual([q.id]);
  });

  it("Steady fail: -15 MP and a token", () => {
    const { s, q } = build("tough_it_out");
    const r = go(s, q, { rng: rngOf(LOW) });
    expect(r.pending.dice).toEqual([2]);
    const out = resolveQuestAttempt(r.state, r.pending);
    expect(out.state.players.player_1.activeSlots[0].mp).toBe(15);
    expect(out.state.questStacks[q.stack].tokens).toBe(1);
    expect(out.state.questStacks[q.stack].faceUp).toBe(q.id);
  });

  it("two fails by different players replace the Quest", () => {
    const { s, q } = build("tough_it_out");
    let st = resolveQuestAttempt(...(([r]) => [r.state, r.pending])([go(s, q, { rng: rngOf(LOW) })])).state;
    st.activePlayerId = "player_2";
    const r2 = rollQuestAttempt(st, "player_2", { slotIndex: 0, stackId: q.stack, rng: rngOf(LOW) });
    expect(r2.ok).toBe(true);
    st = resolveQuestAttempt(r2.state, r2.pending).state;
    expect(st.questStacks[q.stack].faceUp).toBe("quest_filler");
    expect(st.questStacks[q.stack].tokens).toBe(0);
  });

  it("a fresh Mosje may Quest and any stack can be picked", () => {
    const { s, q } = build("tough_it_out", { slot: { entryProtected: true } });
    expect(go(s, q).ok).toBe(true);
    expect(rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId: "ARTISTIC", rng: rngOf(HIGH) }).ok).toBe(true);
  });

  it("refuses a stack with no face-up Quest", () => {
    const { s, q } = build("tough_it_out");
    s.questStacks[q.stack].faceUp = null;
    const r = go(s, q);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });

  it("a stale pending is refused", () => {
    const { s, q } = build("tough_it_out");
    const r = go(s, q);
    r.state.questStacks[q.stack].faceUp = "quest_other";
    expect(resolveQuestAttempt(r.state, r.pending).ok).toBe(false);
  });

  it("a cost is paid before the roll and not refunded on a fail", () => {
    const { s, q } = build("parkour_challenge", { p1: { piecieSlots: [{ cardId: gear, faceDown: true, canActivateOnTurn: 1 }, null, null] } });
    const r = go(s, q, { rng: rngOf(LOW), costChoice: { zone: "ready", index: 0 } });
    expect(r.ok).toBe(true);
    const out = resolveQuestAttempt(r.state, r.pending);
    expect(out.win).toBe(false);
    expect(out.state.players.player_1.piecieSlots[0]).toBeNull();
    expect(out.state.players.player_1.graveyard.map(g => g.cardId)).toEqual([gear]);
  });

  it("an unpayable cost: no attempt, nothing used", () => {
    const { s, q } = build("parkour_challenge");
    const r = go(s, q, { costChoice: { zone: "ready", index: 0 } });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
    expect(s.players.player_1.activeSlots[0].actedThisTurn).toBeFalsy();
  });
});

describe("Trained (E18)", () => {
  it("refuses a one-star Mosje without using the action or a token", () => {
    const { s, q } = build("sprint_race");
    const r = go(s, q, { rng: noRng });
    expect(r.ok).toBe(false);
    expect(s.players.player_1.activeSlots[0].actedThisTurn).toBeFalsy();
    expect(s.questStacks[q.stack].tokens).toBe(0);
  });
  it("wins +25 with no dice and no rng call for two stars", () => {
    const { s, q } = build("sprint_race", { slot: { traits: { ...ONE, physical: 2 } } });
    const r = go(s, q, { rng: noRng });
    expect(r.ok).toBe(true);
    expect(r.pending.dice).toEqual([]);
    const out = resolveQuestAttempt(r.state, r.pending);
    expect(out.state.players.player_1.activeSlots[0].mp).toBe(55);
    expect(out.state.questStacks[q.stack].faceUp).toBe("quest_filler");
  });
});

describe("+1 die rules", () => {
  const dice = (name, o) => {
    const { s, q } = build(name, o?.build);
    const r = go(s, q, o?.roll);
    expect(r.ok).toBe(true);
    return r.pending.diceCount;
  };
  it("Sustained Assault: another own Mosje attacked this turn", () => {
    expect(dice("sustained_assault")).toBe(1);
    expect(dice("sustained_assault", { build: { second: mkSlot({ attackedThisTurn: true }) } })).toBe(2);
  });
  it("Survive Storm: at 30 MP or less", () => {
    expect(dice("survive_storm", { build: { slot: { mp: 30 } } })).toBe(2);
    expect(dice("survive_storm", { build: { slot: { mp: 35 } } })).toBe(1);
  });
  it("Improvise: pays 1 Energy only when asked", () => {
    const { s, q } = build("improvise", { p1: { energy: 3 } });
    expect(go(s, q).pending.diceCount).toBe(1);
    const r = go(s, q, { dieChoices: { payEnergy: true } });
    expect(r.pending.diceCount).toBe(2);
    expect(r.state.players.player_1.energy).toBe(2);
    const broke = build("improvise", { p1: { energy: 0 } });
    expect(go(broke.s, broke.q, { dieChoices: { payEnergy: true } }).pending.diceCount).toBe(1);
  });
  it("Strategy Puzzle: discards a chosen hand card", () => {
    const p1 = { hand: [{ cardId: gear, type: "PIECIE" }] };
    const { s, q } = build("strategy_puzzle", { p1 });
    const r = go(s, q, { dieChoices: { discardHandIndex: 0 } });
    expect(r.pending.diceCount).toBe(2);
    expect(r.state.players.player_1.hand).toHaveLength(0);
    expect(r.state.players.player_1.graveyard.map(g => g.cardId)).toEqual([gear]);
    expect(go(s, q).pending.diceCount).toBe(1);
  });
  it("Calculate Odds: 2+ revealed cards of one type", () => {
    const same = { deck: [{ cardId: gear, type: "PIECIE" }, { cardId: gear, type: "PIECIE" }, { cardId: MOSJES[1].id, type: "MOSJE" }] };
    const diff = { deck: [{ cardId: gear, type: "PIECIE" }, { cardId: MOSJES[1].id, type: "MOSJE" }, { cardId: MOSJES[2].id, type: "MOSJE" }] };
    expect(dice("calculate_odds", { build: { p1: same } })).toBe(2);
    expect(dice("calculate_odds", { build: { p1: diff } })).toBe(2); // two Mosjes share a type
    const none = { deck: [{ cardId: gear, type: "PIECIE" }, { cardId: MOSJES[1].id, type: "MOSJE" }] };
    expect(dice("calculate_odds", { build: { p1: none } })).toBe(1);
  });
  it("Late Night Questing: 2+ gear Piecies in the discard pile", () => {
    const g = { cardId: gear, name: "g", type: "PIECIE", source: "played" };
    expect(dice("late_night_questing", { build: { p1: { graveyard: [g] } } })).toBe(1);
    expect(dice("late_night_questing", { build: { p1: { graveyard: [g, g] } } })).toBe(2);
  });
  it("Artistic Expression: drew 2+ cards this turn", () => {
    expect(dice("artistic_expression", { build: { p1: { cardsDrawnThisTurn: 1 } } })).toBe(1);
    expect(dice("artistic_expression", { build: { p1: { cardsDrawnThisTurn: 2 } } })).toBe(2);
  });
});
