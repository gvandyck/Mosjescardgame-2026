import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import {
  ability_ming_natural_lucky_draw,
  ability_jeffrey_gambler_high_stakes,
  ability_tuk_healer_healing_presence,
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
