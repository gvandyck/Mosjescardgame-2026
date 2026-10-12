import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules, no type declarations
import { playPiecie, activatePiecie, endTurn, startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { isPiecieReady } from "../../src/engine/table/isPiecieReady.js";
// @ts-expect-error
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { PIECIES } from "../../src/data/piecies.js";

const cheap = PIECIES.find((p: any) => (p.cost ?? 0) <= 1 && p.type === "PIECIE") ?? PIECIES[0];
const ref = (id: string) => ({ cardId: id, type: "PIECIE" });

function stateWithHand(ids: string[]) {
  return makeEngineState({
    players: { player_1: { hand: ids.map(ref), energy: 10 } },
  });
}

describe("E22 Piecie timing (2.0)", () => {
  it("is not ready the round it is placed, ready on the owner's next turn", () => {
    let s = stateWithHand([cheap.id]);
    const placed = playPiecie(s, "player_1", ref(cheap.id), cheap);
    expect(placed.success).toBe(true);
    s = placed.state;
    const early = activatePiecie(s, "player_1", 0);
    expect(early.success).toBe(false);
    expect(early.error).toMatch(/next turn/);
    s.turnNumber += 1; // the owner's next turn (round counter)
    expect(isPiecieReady(s.players.player_1.piecieSlots[0], s.turnNumber)).toBe(true);
    const res = activatePiecie(s, "player_1", 0);
    expect(res.error).toBeUndefined();
    expect(res.success).toBe(true);
  });

  it("a face-down entry without canActivateOnTurn is not ready (fail closed)", () => {
    expect(isPiecieReady({ type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1 }, 99)).toBe(false);
    expect(isPiecieReady({ type: "PIECIE", faceDown: true, activated: true, canActivateOnTurn: 1 }, 99)).toBe(false);
    expect(isPiecieReady(null, 1)).toBe(false);
  });

  it("refuses a 4th Piecie and leaves the hand unchanged", () => {
    let s = stateWithHand([cheap.id, cheap.id, cheap.id, cheap.id]);
    for (let i = 0; i < 3; i++) s = playPiecie(s, "player_1", ref(cheap.id), cheap).state;
    const handBefore = s.players.player_1.hand.length;
    const r = playPiecie(s, "player_1", ref(cheap.id), cheap);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.hand.length).toBe(handBefore);
  });

  it("an active Place never uses a Piecie slot", () => {
    let s = stateWithHand([cheap.id, cheap.id, cheap.id]);
    s.activePlace = "place_synergy_chamber";
    s.activePlacePlayedBy = "player_1";
    for (let i = 0; i < 3; i++) {
      const r = playPiecie(s, "player_1", ref(cheap.id), cheap);
      expect(r.success).toBe(true);
      s = r.state;
    }
  });

  it("the owner cannot activate on the opponent's turn", () => {
    let s = stateWithHand([cheap.id]);
    s = playPiecie(s, "player_1", ref(cheap.id), cheap).state;
    s.turnNumber += 1;
    s.activePlayerId = "player_2";
    const r = activatePiecie(s, "player_1", 0);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/own turn/);
  });
});
