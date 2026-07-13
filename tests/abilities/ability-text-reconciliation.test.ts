import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import {
  ability_ming_natural_lucky_draw,
  ability_jeffrey_gambler_high_stakes,
  ability_tuk_healer_healing_presence,
  ability_chris_perfect_setup,
  ability_jisca_perfect_combo,
} from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 1/10
// Ming Natural — Lucky Draw: was an unconditional "draw 1 card" stub with a card
// description promising reveal + Piecie choice + 15 MP. Ruling: TEXT WINS, but as a
// manual-trigger ability (not an auto-hook on every draw event).
// ─────────────────────────────────────────────────────────────

function makeSlot(cardId: string, mp = 50) {
  return {
    cardId,
    name: cardId,
    mp,
    level: 1,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makePlayer(slotCardId: string, mp = 50) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    graveyard: [] as any[],
    activeSlots: [makeSlot(slotCardId, mp), null],
    piecieSlots: [null, null, null, null],
  };
}

function makeState(slotCardId: string, mp = 50) {
  return {
    activePlayerId: "player_1",
    turnNumber: 3,
    players: {
      player_1: makePlayer(slotCardId, mp),
      player_2: makePlayer("mosje_opponent", 100),
    },
  } as any;
}

describe("Ming Natural — Lucky Draw", () => {
  it("draws a non-Piecie card, adds it to hand, and gains 15 MP", () => {
    const state = makeState("mosje_ming_natural", 50);
    state.players.player_1.deck = [{ cardId: "quest_something", type: "QUEST" }];

    const next = ability_ming_natural_lucky_draw(state, "player_1");

    expect(next.players.player_1.hand.map((c: any) => c.cardId)).toEqual(["quest_something"]);
    expect(next.players.player_1.deck).toEqual([]);
    expect(next.players.player_1.activeSlots[0].mp).toBe(65);
  });

  it("free-activates a drawn Piecie when mingNaturalFreeActivate is true (non-persistent effect resolves, ends in graveyard)", () => {
    const state = makeState("mosje_ming_natural", 50);
    state.players.player_1.deck = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    state._pendingTargets = { mingNaturalFreeActivate: true };

    const next = ability_ming_natural_lucky_draw(state, "player_1");

    // effect_kannetje_melk ran: +25 MP to the active Mosje (Ming Natural itself)
    expect(next.players.player_1.activeSlots[0].mp).toBe(75);
    // not added to hand, not a level-up MP gain (no 15 MP bonus for the Piecie branch)
    expect(next.players.player_1.hand).toEqual([]);
    // non-persistent Piecie ends in graveyard, not on the field
    expect(
      next.players.player_1.graveyard.some((c: any) => (c.cardId ?? c) === "piecie_kannetje_melk")
    ).toBe(true);
    expect(
      next.players.player_1.piecieSlots.some((s: any) => s && s.cardId === "piecie_kannetje_melk")
    ).toBe(false);
  });

  it("keeps a drawn Piecie in hand when mingNaturalFreeActivate is false (or absent)", () => {
    const state = makeState("mosje_ming_natural", 50);
    state.players.player_1.deck = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];

    const next = ability_ming_natural_lucky_draw(state, "player_1");

    expect(next.players.player_1.hand.map((c: any) => c.cardId)).toEqual(["piecie_kannetje_melk"]);
    expect(next.players.player_1.deck).toEqual([]);
    // no MP change — the 15 MP bonus only applies to the non-Piecie branch
    expect(next.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it("is a no-op when the deck is empty", () => {
    const state = makeState("mosje_ming_natural", 50);
    state.players.player_1.deck = [];

    const next = ability_ming_natural_lucky_draw(state, "player_1");

    expect(next.players.player_1.hand).toEqual([]);
    expect(next.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it("throws when Ming Natural is not on field", () => {
    const state = makeState("mosje_opponent", 50);
    state.players.player_1.deck = [{ cardId: "quest_something", type: "QUEST" }];

    expect(() => ability_ming_natural_lucky_draw(state, "player_1")).toThrow();
  });
});

describe("Ming Natural ability description", () => {
  it("describes Lucky Draw as a manual activation, not an auto-hook on every draw", () => {
    const ming = MOSJES.find((m: any) => m.id === "mosje_ming_natural");
    expect(ming).toBeTruthy();
    expect(ming.abilityDescription.toLowerCase()).not.toContain("when you draw a card");
    expect(ming.abilityDescription.toLowerCase()).toContain("activate");
  });
});

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 2/10
// Jeffrey Gambler — High Stakes: old wager mechanic (fixed 30 MP bet, 4+ on d6 nets
// +30 MP) dropped entirely (Gandoe: "too OP"). NEW DESIGN: roll 1d6, no MP cost, no
// MP change either way. 1-5 -> QUEST_BLOCKED this turn. 6 -> +3 Quest roll bonus.
// ─────────────────────────────────────────────────────────────

function makeJeffreySlot(mp = 50) {
  return {
    cardId: "mosje_jeffrey_gambler",
    name: "mosje_jeffrey_gambler",
    mp,
    level: 1,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makeJeffreyState(mp = 50) {
  return {
    activePlayerId: "player_1",
    turnNumber: 3,
    players: {
      player_1: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeJeffreySlot(mp), null],
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeJeffreySlot(mp), null],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe("Jeffrey Gambler — High Stakes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rolling a 6 grants +3 questPrepBonus, no status effect, no MP change", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999); // rollDie(6) => 6
    const state = makeJeffreyState(50);

    const next = ability_jeffrey_gambler_high_stakes(state, "player_1");

    expect(next.players.player_1.questPrepBonus).toBe(3);
    expect(next.players.player_1.activeSlots[0].statusEffects).toEqual([]);
    expect(next.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it("rolling below 6 applies QUEST_BLOCKED this turn, no questPrepBonus, no MP change", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // rollDie(6) => 1
    const state = makeJeffreyState(50);

    const next = ability_jeffrey_gambler_high_stakes(state, "player_1");

    expect(next.players.player_1.questPrepBonus).toBeUndefined();
    expect(next.players.player_1.activeSlots[0].statusEffects).toEqual([
      { type: "QUEST_BLOCKED", value: 0, turnsLeft: 1 },
    ]);
    expect(next.players.player_1.activeSlots[0].mp).toBe(50);
  });
});

describe("Jeffrey Gambler ability description", () => {
  it("no longer describes a wager/bet mechanic", () => {
    const jeffrey = MOSJES.find((m: any) => m.id === "mosje_jeffrey_gambler");
    expect(jeffrey).toBeTruthy();
    expect(jeffrey.abilityDescription.toLowerCase()).not.toContain("wager");
  });
});

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 3/10
// Tuk Healer — Healing Presence: was "heal ALL own Mosjes +15 MP" (wrong on every
// axis vs. the card text). NEW DESIGN: once per turn, choose this Mosje OR another
// own Mosje to gain 10 MP. No draw, no extra passive hook.
// ─────────────────────────────────────────────────────────────

function makeTukSlot(cardId: string, mp = 50) {
  return {
    cardId,
    name: cardId,
    mp,
    level: 1,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makeTukState(slots: any[]) {
  return {
    activePlayerId: "player_1",
    turnNumber: 3,
    players: {
      player_1: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: slots,
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeTukSlot("mosje_opponent", 100), null],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe("Tuk Healer — Healing Presence", () => {
  it("defaults to healing itself +10 MP when no target is given (e.g. solo on field)", () => {
    const state = makeTukState([makeTukSlot("mosje_tuk_healer", 50), null]);

    const next = ability_tuk_healer_healing_presence(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(60);
  });

  it("heals the chosen own Mosje +10 MP via _pendingTargets.own_slot_index, leaving itself untouched", () => {
    const state = makeTukState([
      makeTukSlot("mosje_tuk_healer", 50),
      makeTukSlot("mosje_ally", 30),
    ]);
    state._pendingTargets = { own_slot_index: 1 };

    const next = ability_tuk_healer_healing_presence(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(50); // Tuk Healer unchanged
    expect(next.players.player_1.activeSlots[1].mp).toBe(40); // ally +10
  });

  it("throws when Tuk Healer is not on field", () => {
    const state = makeTukState([makeTukSlot("mosje_other", 50), null]);

    expect(() => ability_tuk_healer_healing_presence(state, "player_1")).toThrow();
  });
});

describe("Tuk Healer ability description", () => {
  it("no longer describes the old 25/15-MP split or the +10-extra passive hook", () => {
    const tuk = MOSJES.find((m: any) => m.id === "mosje_tuk_healer");
    expect(tuk).toBeTruthy();
    const desc = tuk.abilityDescription.toLowerCase();
    expect(desc).not.toContain("25 mp");
    expect(desc).not.toContain("extra");
  });
});

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 4/10
// Chris All-Rounder — Perfect Setup: was an inert flag write (instantPiecieThisTurn,
// never read anywhere). Ruling: TEXT WINS but drop the 15 MP gain. Gate: 3+
// face-down Piecies required. Effect: pick one and unlock it for free same-turn
// activation (mirrors Youri's two-step: this fn only sets canActivateOnTurn; the
// UI calls the shared activatePiecie() to actually resolve it).
// ─────────────────────────────────────────────────────────────

function makeFaceDownPiecieSlot(cardId: string) {
  return { cardId, type: "PIECIE", faceDown: true, activated: false };
}

function makeChrisState(piecieSlots: any[]) {
  return {
    activePlayerId: "player_1",
    turnNumber: 5,
    players: {
      player_1: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeTukSlot("mosje_chris", 50), null],
        piecieSlots,
      },
      player_2: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeTukSlot("mosje_opponent", 100), null],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe("Chris All-Rounder — Perfect Setup", () => {
  it("throws when fewer than 3 face-down Piecies are on the field", () => {
    const state = makeChrisState([
      makeFaceDownPiecieSlot("piecie_a"),
      makeFaceDownPiecieSlot("piecie_b"),
      null,
      null,
    ]);

    expect(() => ability_chris_perfect_setup(state, "player_1")).toThrow();
  });

  it("unlocks the chosen slot (via _pendingTargets) for same-turn activation, leaving others untouched", () => {
    const state = makeChrisState([
      makeFaceDownPiecieSlot("piecie_a"),
      makeFaceDownPiecieSlot("piecie_b"),
      makeFaceDownPiecieSlot("piecie_c"),
      null,
    ]);
    state._pendingTargets = { chrisPerfectSetupSlotIndex: 2 };

    const next = ability_chris_perfect_setup(state, "player_1");

    expect(next.players.player_1.piecieSlots[2].canActivateOnTurn).toBe(5);
    expect(next.players.player_1.piecieSlots[0].canActivateOnTurn).toBeUndefined();
    expect(next.players.player_1.piecieSlots[1].canActivateOnTurn).toBeUndefined();
    // no MP gain — the old 15 MP bonus was dropped
    expect(next.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it("falls back to the first qualifying slot when no valid selection is given (bot-safe)", () => {
    const state = makeChrisState([
      makeFaceDownPiecieSlot("piecie_a"),
      makeFaceDownPiecieSlot("piecie_b"),
      makeFaceDownPiecieSlot("piecie_c"),
      null,
    ]);

    const next = ability_chris_perfect_setup(state, "player_1");

    expect(next.players.player_1.piecieSlots[0].canActivateOnTurn).toBe(5);
  });

  it("throws when Chris All-Rounder is not on field", () => {
    const state = makeChrisState([
      makeFaceDownPiecieSlot("piecie_a"),
      makeFaceDownPiecieSlot("piecie_b"),
      makeFaceDownPiecieSlot("piecie_c"),
      null,
    ]);
    state.players.player_1.activeSlots[0].cardId = "mosje_other";

    expect(() => ability_chris_perfect_setup(state, "player_1")).toThrow();
  });
});

describe("Chris All-Rounder ability description", () => {
  it("no longer promises a 15 MP gain", () => {
    const chris = MOSJES.find((m: any) => m.id === "mosje_chris");
    expect(chris).toBeTruthy();
    expect(chris.abilityDescription.toLowerCase()).not.toContain("15 mp");
  });
});

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 5/10 (of the original 9)
// Jisca — Perfect Combo: NEW DESIGN replacing both old text AND old code (a
// "+20 MP if last card was a Piecie" stub). Roll 1d6: 1-4 no effect, 5-6 pick ANY
// Piecie on the field (face-down or already-active) and free-activate it.
// ─────────────────────────────────────────────────────────────

function makeJiscaSlot(cardId: string, mp = 50) {
  return {
    cardId,
    name: cardId,
    mp,
    level: 1,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makeJiscaState(piecieSlots: any[]) {
  return {
    activePlayerId: "player_1",
    turnNumber: 7,
    players: {
      player_1: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeJiscaSlot("mosje_jisca", 50), null],
        piecieSlots,
      },
      player_2: {
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeJiscaSlot("mosje_opponent", 100), null],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe("Jisca — Perfect Combo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rolling 1-4 has no effect and doesn't touch any Piecie slot", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // rollDie(6) => 1
    const state = makeJiscaState([makeFaceDownPiecieSlot("piecie_a"), null, null, null]);

    const result = ability_jisca_perfect_combo(state, "player_1");

    expect(result.success).toBe(true);
    expect(result.jiscaRoll).toBe(1);
    expect(result.state.players.player_1.piecieSlots[0].canActivateOnTurn).toBeUndefined();
  });

  it("rolling 5-6 with a single face-down Piecie unlocks it (canActivateOnTurn set, not yet flipped)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeJiscaState([makeFaceDownPiecieSlot("piecie_a"), null, null, null]);

    const result = ability_jisca_perfect_combo(state, "player_1");

    expect(result.jiscaRoll).toBe(6);
    expect(result.jiscaChainedFaceDown).toBe(true);
    expect(result.jiscaChainedSlot).toBe(0);
    expect(result.state.players.player_1.piecieSlots[0].canActivateOnTurn).toBe(7);
    expect(result.state.players.player_1.piecieSlots[0].faceDown).toBe(true); // step 2 (activatePiecie) is the UI's job
  });

  it("rolling 5-6 with a single already-active Piecie runs its effect fn directly", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const activeSlot = { cardId: "piecie_kannetje_melk", type: "PIECIE", faceDown: false, activated: true };
    const state = makeJiscaState([activeSlot, null, null, null]);

    const result = ability_jisca_perfect_combo(state, "player_1");

    expect(result.jiscaChainedFaceDown).toBe(false);
    expect(result.jiscaChainedSlot).toBe(0);
    // effect_kannetje_melk ran: +25 MP to the active Mosje (Jisca itself)
    expect(result.state.players.player_1.activeSlots[0].mp).toBe(75);
  });

  it("with multiple eligible Piecies, honors _pendingTargets.jiscaComboSlotIndex", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeJiscaState([
      makeFaceDownPiecieSlot("piecie_a"),
      makeFaceDownPiecieSlot("piecie_b"),
      null,
      null,
    ]);
    state._pendingTargets = { jiscaComboSlotIndex: 1 };

    const result = ability_jisca_perfect_combo(state, "player_1");

    expect(result.jiscaChainedSlot).toBe(1);
    expect(result.state.players.player_1.piecieSlots[1].canActivateOnTurn).toBe(7);
    expect(result.state.players.player_1.piecieSlots[0].canActivateOnTurn).toBeUndefined();
  });

  it("rolling 5-6 with no Piecie on the field has no effect beyond the roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeJiscaState([null, null, null, null]);

    const result = ability_jisca_perfect_combo(state, "player_1");

    expect(result.jiscaRoll).toBe(6);
    expect(result.jiscaChainedSlot).toBeUndefined();
  });

  it("throws when Jisca is not on field", () => {
    const state = makeJiscaState([makeFaceDownPiecieSlot("piecie_a"), null, null, null]);
    state.players.player_1.activeSlots[0].cardId = "mosje_other";

    expect(() => ability_jisca_perfect_combo(state, "player_1")).toThrow();
  });
});

describe("Jisca ability description", () => {
  it("no longer describes the old flat +20 MP combo stub", () => {
    const jisca = MOSJES.find((m: any) => m.id === "mosje_jisca");
    expect(jisca).toBeTruthy();
    const desc = jisca.abilityDescription.toLowerCase();
    expect(desc).not.toContain("opponent loses 15 mp");
    expect(desc).not.toContain("this mosje loses 10 mp");
  });
});
