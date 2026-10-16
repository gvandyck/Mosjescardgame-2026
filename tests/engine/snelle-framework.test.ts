// Phase 60-01 (EFX-03): Snelle framework - effect context, Needs / Only-if gate, pick pause, copy limit.
import { describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { playSnellie } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error
import { getEligibleReactions } from "../../src/engine/reactions/getEligibleReactions.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error
import { getCopyLimit } from "../../src/data/getCopyLimit.js";
// @ts-expect-error
import { SNELLE_PIECIES } from "../../src/data/snellePiecies.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error
import * as effects from "../../src/abilities/snelleEffects.js";

vi.mock("../../src/abilities/snelleEffects.js", async (orig: any) => {
  const real = await orig();
  return { ...real, effect_snelle_emergency_healings: vi.fn((s: any) => s) };
});

const def = (id: string) => SNELLE_PIECIES.find((d: any) => d.id === id);
const mk = (mp: number, traits: any = {}, id = "mosje_ming_predictor") => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
  s.entryProtected = false;
  s.traits = { ...s.traits, ...traits };
  return s;
};
const H = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: "SNELLE_PIECIE" }));
const ATT = { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 };
function board(p2: any = {}, p1: any = {}) {
  return makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { activeSlots: [mk(50, { physical: 3 }, "mosje_alyssa_bulldozer"), mk(50)], energy: 10, ...p1 },
      player_2: { activeSlots: [mk(50), mk(50)], energy: 6, ...p2 },
    },
  });
}
const play = (s: any, pid: string, id: string, opts: any = {}) => playSnellie(s, pid, { cardId: id, type: "SNELLE_PIECIE" }, def(id), opts);

describe("Snelle context", () => {
  it("a Snelle played in a window gets ctx.reaction (moments, preview, held action, actor)", () => {
    const s = board({ hand: H("snelle_emergency_healings") });
    const held = attackMosje(s, "player_1", ATT);
    expect(held.state.pendingReaction.responderId).toBe("player_2");
    const fn = (effects as any).effect_snelle_emergency_healings;
    fn.mockClear();
    resolveReaction(held.state, "player_2", "snelle_emergency_healings");
    const ctx = fn.mock.calls[0][2];
    expect(ctx.reaction.moments).toContain("wouldLoseMp");
    expect(ctx.reaction.action.type).toBe("attack");
    expect(ctx.reaction.actorId).toBe("player_1");
    expect(ctx.reaction.preview.mpLoss).toBeTruthy();
  });
  it("played freely the reaction is null", () => {
    const fn = (effects as any).effect_snelle_emergency_healings;
    fn.mockClear();
    play(board({}, { hand: H("snelle_emergency_healings") }), "player_1", "snelle_emergency_healings");
    expect(fn.mock.calls[0][2].reaction).toBeNull();
  });
});

describe("Needs / Only if", () => {
  it("Perfect Dodge is offered only for a Physical 2 star attacked Mosje", () => {
    const ok = attackMosje(board({ hand: H("snelle_perfect_dodge"), activeSlots: [mk(50, { physical: 2 }), mk(50)] }), "player_1", ATT);
    expect(ok.state.pendingReaction.eligible).toContain("snelle_perfect_dodge");
    const no = attackMosje(board({ hand: H("snelle_perfect_dodge"), activeSlots: [mk(50, { physical: 1 }), mk(50)] }), "player_1", ATT);
    expect(no.state.pendingReaction?.eligible ?? []).not.toContain("snelle_perfect_dodge");
  });
  it("Lucky Coin without Creative 1 star is not offered", () => {
    const s = board({ hand: H("snelle_lucky_coin"), activeSlots: [mk(50, { creative: 0 }), null] });
    expect(getEligibleReactions(s, "player_2", ["afterQuestRoll"])).not.toContain("snelle_lucky_coin");
    s.players.player_2.activeSlots[0].traits.creative = 1;
    expect(getEligibleReactions(s, "player_2", ["afterQuestRoll"])).toContain("snelle_lucky_coin");
  });
  it("a refused play pays no Energy and keeps the card in hand", () => {
    const s = board({}, { hand: H("snelle_jantje_jantje_jantje", "snelle_bijna_welloe") });
    for (const id of ["snelle_jantje_jantje_jantje", "snelle_bijna_welloe"]) {
      const r = play(s, "player_1", id);
      expect(r.success).toBe(false);
      expect(r.state.players.player_1.hand).toHaveLength(2);
      expect(r.state.players.player_1.energy).toBe(10);
      expect(r.state.players.player_1.piecieSlots.every((x: any) => x === null)).toBe(true);
    }
  });
});

describe("pick pause", () => {
  it("a two-Mosje pick pauses on hook 'snelle' and resumes the same play once", () => {
    const s = board({}, { hand: H("snelle_momentum_rush") });
    const r = play(s, "player_1", "snelle_momentum_rush");
    expect(r.success).toBe(true);
    const pc = r.state.pendingChoice;
    expect(pc.hook).toBe("snelle");
    expect(r.state.players.player_1.piecieSlots.some((x: any) => x?.cardId === "snelle_momentum_rush")).toBe(true);
    expect(r.state.players.player_1.graveyard).toHaveLength(0);
    const out = resolvePendingChoice(r.state, pc.options[1]);
    const p1 = out.state.players.player_1;
    expect(p1.activeSlots[1].mp).toBe(65);
    expect(p1.activeSlots[0].mp).toBe(50);
    expect(p1.piecieSlots.every((x: any) => x === null)).toBe(true);
    expect(p1.graveyard.filter((g: any) => g.cardId === "snelle_momentum_rush")).toHaveLength(1);
    expect(out.state.pendingChoice).toBeUndefined();
  });
  it("a paused Snelle inside a reaction window replays the held action only after the pick", () => {
    const fn = (effects as any).effect_snelle_emergency_healings;
    const opts = [0, 1].map((slotIndex) => ({ playerId: "player_2", slotIndex, label: "m" + slotIndex }));
    fn.mockImplementationOnce((s: any) => ({ state: JSON.parse(JSON.stringify(s)), needChoice: { playerId: "player_2", key: "k", options: opts } }));
    const held = attackMosje(board({ hand: H("snelle_emergency_healings") }), "player_1", ATT);
    const r = resolveReaction(held.state, "player_2", "snelle_emergency_healings");
    expect(r.state.pendingChoice.hook).toBe("snelle");
    expect(r.state.pendingReaction).toBeUndefined();
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(50); // the attack has not landed yet
    const out = resolvePendingChoice(r.state, opts[0]);
    expect(out.state.players.player_2.activeSlots[0].mp).toBeLessThan(50); // held attack replayed after the pick
    expect(out.state.players.player_2.graveyard.filter((g: any) => g.cardId === "snelle_emergency_healings")).toHaveLength(1);
  });
});

describe("copy limit", () => {
  it("The Protector and Blensen! are limit 1 per deck", () => {
    expect(getCopyLimit(def("snelle_the_protector"))).toBe(1);
    expect(getCopyLimit(def("snelle_blensen"))).toBe(1);
  });
});
