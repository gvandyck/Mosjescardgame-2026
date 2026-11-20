// Sim seed 64809 (CV mirror): Drain Reversal's 10 MP sent the opponent's Mosje sideways while its ability was held in the
// reaction window. The held ability must fizzle (ok), like a held attack (Drain Reversal ruling 2026-10-18), not be refused.
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_ronald_mastermind");

describe("held Mosje ability whose Mosje can no longer act", () => {
  it("fizzles instead of being refused", () => {
    const slot = createMosjeSlot(def, { level: 1, mp: 40 });
    slot.sideways = true;
    const s = makeEngineState({ turnNumber: 3, activePlayerId: "player_1", players: { player_1: { activeSlots: [slot, null] }, player_2: {} } });
    s.pendingReaction = { id: "r1", responderId: "player_2", actorId: "player_1", moments: ["targeted"], eligible: [], queue: [],
      action: { type: "mosjeAbility", args: ["player_1", "mosje_ronald_mastermind"] }, preview: { getemt: [], toWelloe: false, mpLoss: {} } };
    const r = resolveReaction(s, "player_2", null);
    expect(r.ok).toBe(true);
    expect(r.fizzled).toBe(true);
  });
});
