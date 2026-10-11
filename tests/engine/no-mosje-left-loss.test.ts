import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { markMosjeDefeated, checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { checkLoss } from "../../src/engine/winLose/checkLoss.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");
const other = MOSJES.find((m: any) => m.id !== "mosje_gandoe_wizard");
const mosjeCard = { cardId: other.id, name: other.name, type: "MOSJE" };
const piecie = { cardId: "piecie_x", type: "PIECIE" };

function build(p2: any = {}) {
  const mine = createMosjeSlot(def, { level: 1, mp: 50 });
  const foe = createMosjeSlot(other, { level: 1, mp: 50 });
  return makeEngineState({
    players: {
      player_1: { activeSlots: [mine, null], deck: [piecie] },
      player_2: { activeSlots: [foe, null], hand: [piecie], deck: [piecie], ...p2 },
    },
  });
}

const kill = (s: any) => markMosjeDefeated(s, "player_2", 0);

describe("no Mosje left = loss (Obby 2.0 §2c)", () => {
  it("E8: last field Mosje to the Welloe pile, none in hand/deck -> player_1 wins by KNOCKOUT", () => {
    const s = kill(build());
    expect(s.status).toBe("FINISHED");
    expect(s.winnerId).toBe("player_1");
    expect(s.winReason).toBe("KNOCKOUT");
    expect(s.players.player_2.welloePile).toHaveLength(1);
  });

  it("E8 negative: a Mosje still in hand -> game continues", () => {
    const s = kill(build({ hand: [mosjeCard] }));
    expect(s.status).toBe("PLAYING");
  });

  it("E8 negative: a Mosje still in the deck -> game continues", () => {
    const s = kill(build({ deck: [mosjeCard] }));
    expect(s.status).toBe("PLAYING");
  });

  it("E8: a Mosje only in the discard pile does not count -> loss", () => {
    const s = kill(build({ graveyard: [mosjeCard] }));
    expect(s.status).toBe("FINISHED");
    expect(s.winReason).toBe("KNOCKOUT");
  });

  it("checkLoss: empty field + Mosje in deck -> false; nothing anywhere -> true", () => {
    expect(checkLoss({ activeSlots: [null, null], hand: [], deck: [mosjeCard] })).toBe(false);
    expect(checkLoss({ activeSlots: [null, null], hand: [piecie], deck: [piecie], graveyard: [mosjeCard] })).toBe(true);
  });

  it("an empty field with a Mosje in hand is not a loss on a plain checkVictory", () => {
    const s = build({ activeSlots: [null, null], hand: [mosjeCard] });
    expect(checkVictory(s).status).toBe("PLAYING");
  });
});
