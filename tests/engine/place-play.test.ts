// @ts-nocheck
import { describe, it, expect } from "vitest";
import { playPlace } from "../../src/engine/turnManager.js";
import { destroyActivePlace } from "../../src/engine/gameState.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

// E24 - Places are played from hand, one in play, effect at once, no slot.
const REF = { cardId: "place_drain_zone", type: "PLACE" };
const DEF = { name: "Drain Zone", cost: 3, trigger: "END_PHASE" };
const build = (extra = {}, p1 = {}) =>
  makeEngineState({ turnNumber: 3, players: { player_1: { energy: 5, hand: [REF], ...p1 } }, ...extra });

describe("E24 - Place from hand", () => {
  it("plays on own turn: leaves hand, pays Energy, sets activePlace, uses no slot", () => {
    const before = build();
    const r = playPlace(before, "player_1", REF, DEF);
    expect(r.success).toBe(true);
    const p = r.state.players.player_1;
    expect(p.hand).toHaveLength(0);
    expect(p.energy).toBe(2);
    expect(r.state.activePlace).toBe("place_drain_zone");
    expect(r.state.activePlacePlayedBy).toBe("player_1");
    expect(p.piecieSlots).toEqual(before.players.player_1.piecieSlots);
  });

  it("a PASSIVE Place works in the same call", () => {
    const hand = [{ cardId: "place_momentum_stabilizer", type: "PLACE" }];
    const r = playPlace(build({}, { hand }), "player_1", hand[0], { name: "Momentum Stabilizer", cost: 0, trigger: "PASSIVE" });
    expect(r.success).toBe(true);
    expect(r.state.activePlace).toBe("place_momentum_stabilizer");
  });

  it("refuses a second Place while one is in play and keeps the first", () => {
    const s = build({ activePlace: "place_boxing_ring", activePlacePlayedBy: "player_2" });
    const r = playPlace(s, "player_1", REF, DEF);
    expect(r.success).toBe(false);
    expect(r.error).toBe("A Place is already in play");
    expect(r.state.activePlace).toBe("place_boxing_ring");
    expect(r.state.players.player_1.hand).toHaveLength(1);
    expect(r.state.players.player_1.energy).toBe(5);
  });

  it("refuses on the opponent's turn", () => {
    const r = playPlace(build({ activePlayerId: "player_2" }), "player_1", REF, DEF);
    expect(r.success).toBe(false);
    expect(r.state.activePlace).toBeNull();
  });

  it("refuses on a cooldown turn", () => {
    const r = playPlace(build({}, { cooldownTurn: true }), "player_1", REF, DEF);
    expect(r.success).toBe(false);
  });

  it("refuses without enough Energy", () => {
    const r = playPlace(build({}, { energy: 2 }), "player_1", REF, DEF);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.hand).toHaveLength(1);
  });

  it("destroyed Place goes to its player's discard and frees the slot-less spot", () => {
    const played = playPlace(build(), "player_1", REF, DEF).state;
    const gone = destroyActivePlace(played);
    expect(gone.activePlace).toBeNull();
    expect(gone.players.player_1.graveyard[0]).toMatchObject({ cardId: "place_drain_zone", type: "PLACE" });
    expect(gone.players.player_2.graveyard).toHaveLength(0);
    const again = playPlace({ ...gone, players: { ...gone.players, player_1: { ...gone.players.player_1, hand: [REF], energy: 5 } } }, "player_1", REF, DEF);
    expect(again.success).toBe(true);
  });
});
