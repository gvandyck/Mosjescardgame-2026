// TABLE-04 engine: reaction windows (defender + acting player), eligibility, queue, no reopen, data map.
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error
import { activatePiecie, playSnellie } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { REACTION_MOMENTS } from "../../src/engine/reactions/reactionMoments.js";
// @ts-expect-error
import { SNELLE_PIECIES } from "../../src/data/snellePiecies.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const attackerDef = MOSJES.find((m: any) => m.id === "mosje_alyssa_bulldozer"); // L1 Power 20
const plain = MOSJES.find((m: any) => m.id !== "mosje_alyssa_bulldozer" && m.id !== "mosje_parkour_west");
const mk = (mp: number, d = plain, level = 1, extra: any = {}) => {
  const s = createMosjeSlot(d, { level, mp });
  s.entryProtected = false;
  return Object.assign(s, extra);
};
const H = (...ids: string[]) => ids.map((cardId) => ({ cardId }));
const ATT = { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 };

function board(p2: any = {}, p1: any = {}, top: any = {}) {
  return makeEngineState({
    turnNumber: 3,
    ...top,
    players: {
      player_1: { activeSlots: [mk(50, attackerDef), mk(50)], ...p1 },
      player_2: { activeSlots: [mk(50), mk(50)], ...p2 },
    },
  });
}
const ready = { cardId: "piecie_dikke_taks", type: "PIECIE", faceDown: true, activated: false, canActivateOnTurn: 1 };
const mp2 = (s: any, i = 0) => s.players.player_2.activeSlots[i].mp;

describe("defender windows", () => {
  it("attacked + wouldLoseMp: unchanged state, pendingReaction, serialisable", () => {
    const s = board({ hand: H("snelle_perfect_dodge", "snelle_the_protector") });
    const r = attackMosje(s, "player_1", ATT);
    expect(r.ok).toBe(true);
    expect(mp2(r.state)).toBe(50);
    const p = r.state.pendingReaction;
    expect(p.responderId).toBe("player_2");
    expect(p.moments).toEqual(expect.arrayContaining([REACTION_MOMENTS.ATTACKED, REACTION_MOMENTS.WOULD_LOSE_MP]));
    expect([...p.eligible].sort()).toEqual(["snelle_perfect_dodge", "snelle_the_protector"]);
    expect(p.action.type).toBe("attack");
    expect(JSON.parse(JSON.stringify(p))).toEqual(p);
  });
  it("no window: full slots, no Energy, cooldown, non-matching Snelle", () => {
    const full = [1, 2, 3].map((i) => ({ cardId: "x" + i, type: "PIECIE", faceDown: true }));
    const cases = [
      { hand: H("snelle_perfect_dodge"), piecieSlots: full },
      { hand: H("snelle_perfect_dodge"), energy: 0 },
      { hand: H("snelle_perfect_dodge"), cooldownTurn: true },
      { hand: H("snelle_ff_haaltje_nemen") },
    ];
    for (const c of cases) {
      const r = attackMosje(board(c), "player_1", ATT);
      expect(r.ok).toBe(true);
      expect(r.state.pendingReaction).toBeUndefined();
      expect(mp2(r.state)).toBe(30);
    }
  });
  it("toWelloe: attack that would getemt a sideways L1 Mosje offers Not Today!", () => {
    const s = board({ hand: H("snelle_negate_elimination"), activeSlots: [mk(10, plain, 1, { sideways: true }), mk(50)] });
    const r = attackMosje(s, "player_1", ATT);
    expect(r.state.pendingReaction?.moments).toContain(REACTION_MOMENTS.TO_WELLOE);
    expect(r.state.pendingReaction?.eligible).toContain("snelle_negate_elimination");
    expect(r.state.pendingReaction?.preview.toWelloe).toBe(true);
  });
  it("pass replays the attack once and never reopens", () => {
    const s = board({ hand: H("snelle_perfect_dodge") });
    const w = attackMosje(s, "player_1", ATT).state;
    const done = resolveReaction(w, "player_2", null);
    expect(done.ok).toBe(true);
    expect(done.state.pendingReaction).toBeUndefined();
    expect(mp2(done.state)).toBe(30);
  });
  it("playing a card: leaves hand, Energy paid, discard, then replay", () => {
    const s = board({ hand: H("snelle_perfect_dodge") });
    const w = attackMosje(s, "player_1", ATT).state;
    const done = resolveReaction(w, "player_2", "snelle_perfect_dodge");
    expect(done.ok).toBe(true);
    const p2 = done.state.players.player_2;
    expect(p2.hand).toHaveLength(0);
    expect(p2.energy).toBeLessThan(6);
    expect(p2.graveyard.map((g: any) => g.cardId)).toContain("snelle_perfect_dodge");
    expect(done.state.pendingReaction).toBeUndefined();
  });
  it("wrong player or non-eligible card: ok:false, state unchanged", () => {
    const w = attackMosje(board({ hand: H("snelle_perfect_dodge", "snelle_ff_haaltje_nemen") }), "player_1", ATT).state;
    const a = resolveReaction(w, "player_1", null);
    const b = resolveReaction(w, "player_2", "snelle_ff_haaltje_nemen");
    expect(a.ok).toBe(false);
    expect(b.ok).toBe(false);
    expect(a.state).toBe(w);
    expect(b.state).toBe(w);
  });
});

describe("Piecie activation windows", () => {
  const mkp = (hand2: string[], hand1: string[] = []) =>
    board({ hand: H(...hand2) }, { hand: H(...hand1), energy: 10, piecieSlots: [{ ...ready }, null, null] });
  it("defender: afterPiecieActivation + targeted + wouldLoseMp; Jammertje offered", () => {
    const r = activatePiecie(mkp(["snelle_jammertje_gepakt", "snelle_counter_strikka", "snelle_jensen"]), "player_1", 0);
    expect(r.success).toBe(true);
    const p = r.state.pendingReaction;
    expect(p.moments).toEqual(expect.arrayContaining(["afterPiecieActivation", "targeted", "wouldLoseMp"]));
    expect(p.eligible).toEqual(expect.arrayContaining(["snelle_jammertje_gepakt", "snelle_counter_strikka", "snelle_jensen"]));
  });
  it("Jammertje is never offered for a Snelle play", () => {
    const s = board({ hand: H("snelle_jammertje_gepakt") }, { hand: H("snelle_momentum_rush"), energy: 10 });
    const def = SNELLE_PIECIES.find((d: any) => d.id === "snelle_momentum_rush");
    const r = playSnellie(s, "player_1", { cardId: "snelle_momentum_rush", type: "SNELLE_PIECIE" }, def);
    expect(r.state.pendingReaction).toBeUndefined();
  });
  it("afterOwnPiecieActivation: actor window opens after the defender window, or directly", () => {
    const both = activatePiecie(mkp(["snelle_counter_strikka"], ["snelle_dubbele_temminks"]), "player_1", 0).state;
    expect(both.pendingReaction.responderId).toBe("player_2");
    expect(both.pendingReaction.queue).toEqual([{ responderId: "player_1", moments: ["afterOwnPiecieActivation"] }]);
    const next = resolveReaction(both, "player_2", null);
    expect(next.state.pendingReaction.responderId).toBe("player_1");
    expect(next.state.pendingReaction.moments).toEqual(["afterOwnPiecieActivation"]);
    const end = resolveReaction(next.state, "player_1", null);
    expect(end.state.pendingReaction).toBeUndefined();
    const direct = activatePiecie(mkp([], ["snelle_dubbele_temminks"]), "player_1", 0).state;
    expect(direct.pendingReaction.responderId).toBe("player_1");
  });
  it("jensenPlayed: Jensen! in a targeted window opens Frenssen! for the other player", () => {
    const w = activatePiecie(mkp(["snelle_jensen"], ["snelle_frenssen"]), "player_1", 0).state;
    const r = resolveReaction(w, "player_2", "snelle_jensen");
    expect(r.state.pendingReaction.responderId).toBe("player_1");
    expect(r.state.pendingReaction.moments).toEqual(["jensenPlayed"]);
    const end = resolveReaction(r.state, "player_1", null);
    expect(end.state.pendingReaction).toBeUndefined();
  });
});

describe("data map", () => {
  const known = new Set(Object.values(REACTION_MOMENTS));
  it("every Snelle has reactionMoments in REACTION_MOMENTS", () => {
    for (const d of SNELLE_PIECIES) {
      expect(Array.isArray(d.reactionMoments), d.id).toBe(true);
      for (const m of d.reactionMoments) expect(known.has(m), d.id + " " + m).toBe(true);
    }
  });
  it("matches the 57-RESEARCH map", () => {
    const get = (id: string) => SNELLE_PIECIES.find((d: any) => d.id === id).reactionMoments;
    expect(get("snelle_lucky_coin")).toEqual(["afterQuestRoll", "afterOwnQuestRoll"]);
    expect(get("snelle_negate_elimination")).toEqual(["toWelloe"]);
    expect(get("snelle_sleutelpuntje")).toEqual(["beforeOwnQuestRoll"]);
    expect(get("snelle_frenssen")).toEqual(["jensenPlayed"]);
    expect(get("snelle_jammertje_gepakt")).toEqual(["afterPiecieActivation"]);
    expect(get("snelle_momentum_rush")).toEqual([]);
  });
});
