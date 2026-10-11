// @ts-nocheck
// E21 - Obby 2.0 RULE-07 cooldown turn (replaces the V4 deck-out skip).
import { describe, it, expect } from "vitest";
import { startTurn, endTurn, phaseDrawCard, playMosje, playPlace, playPiecie, activatePiecie, playSnellie, useMosjeAbility, attemptGeneralQuest, attemptPersonalQuest, activatePersonalQuest, activatePlace } from "../../src/engine/turnManager.js";
import { isCooldownBlocked } from "../../src/engine/turn/isCooldownBlocked.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const slot = () => createMosjeSlot(MOSJES[0]);
const ERR = "Cooldown turn: only face-down Piecies";

function deckedOut() {
  const st = makeEngineState();
  for (const id of ["player_1", "player_2"]) st.players[id].activeSlots = [slot(), null];
  const p = st.players.player_1;
  p.deck = [];
  p.graveyard = ["a", "b", "c"];
  p.welloePile = ["w"];
  p.energy = 2;
  return st;
}

describe("E21 - cooldown turn", () => {
  it("deck-out reshuffles the discard (never the Welloe pile), draws, marks cooldown, still +1 Energy", () => {
    const s = startTurn(deckedOut());
    const p = s.players.player_1;
    expect(p.hand).toHaveLength(1);
    expect(p.deck).toHaveLength(2);
    expect([...p.deck, ...p.hand].sort()).toEqual(["a", "b", "c"]);
    expect(p.graveyard).toEqual([]);
    expect(p.welloePile).toEqual(["w"]);
    expect(p.cooldownTurn).toBe(true);
    expect(p.energy).toBe(3);
    expect(isCooldownBlocked(s, "player_1")).toBe(true);
  });

  it("refuses every non-Piecie action on the cooldown turn but allows playPiecie", () => {
    const s = startTurn(deckedOut());
    const checks = [
      playMosje(s, "player_1", { cardId: MOSJES[1].id }),
      playPlace(s, "player_1", { cardId: "x" }, {}),
      activatePiecie(s, "player_1", 0),
      playSnellie(s, "player_1", { cardId: "x" }, {}),
      useMosjeAbility(s, "player_1", MOSJES[0].id),
      attemptGeneralQuest(s),
      attemptPersonalQuest(s, "x"),
      activatePersonalQuest(s, "player_1", 0),
      activatePlace(s, "player_1", 0),
    ];
    for (const r of checks) {
      expect(r.success).toBe(false);
      expect(r.error).toBe(ERR);
    }
    s.players.player_1.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    const r = playPiecie(s, "player_1", { cardId: "piecie_kannetje_melk", type: "PIECIE" }, {});
    expect(r.success).toBe(true);
  });

  it("endTurn clears the flag; opponent is not skipped; next own turn is normal", () => {
    let s = endTurn(startTurn(deckedOut()));
    expect(s.players.player_1.cooldownTurn).toBe(false);
    expect(s.activePlayerId).toBe("player_2");
    s = endTurn(startTurn(s));
    s = startTurn(s);
    expect(s.activePlayerId).toBe("player_1");
    expect(s.players.player_1.cooldownTurn).toBe(false);
  });

  it("deck-out on the opponent's turn survives their endTurn and blocks the next own turn", () => {
    let st = makeEngineState();
    for (const id of ["player_1", "player_2"]) st.players[id].activeSlots = [slot(), null];
    st.activePlayerId = "player_2";
    st.players.player_1.graveyard = ["a", "b"];
    st = phaseDrawCard(st, "player_1", 1, true); // player_2 is active
    st = endTurn(st);
    expect(st.players.player_1.cooldownTurn).toBe(true);
    st = startTurn(st);
    expect(st.activePlayerId).toBe("player_1");
    expect(isCooldownBlocked(st, "player_1")).toBe(true);
    expect(endTurn(st).players.player_1.cooldownTurn).toBe(false);
  });

  it("deck and discard both empty: no draw, no cooldown", () => {
    const st = deckedOut();
    st.players.player_1.graveyard = [];
    const s = startTurn(st);
    expect(s.players.player_1.hand).toHaveLength(0);
    expect(s.players.player_1.cooldownTurn).toBeFalsy();
  });
});
