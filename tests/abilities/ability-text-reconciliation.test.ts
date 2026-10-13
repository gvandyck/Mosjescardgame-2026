import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import {
  ability_ming_natural_lucky_draw,
  ability_jeffrey_gambler_high_stakes,
  ability_tuk_healer_healing_presence,
  ability_chris_perfect_setup,
  ability_jisca_perfect_combo,
  ability_fps_coert_headshot_precision,
} from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { forceQuestResult } from "../helpers/forceQuestResult.js";
// @ts-expect-error — JS module, no type declarations
import { ability_chris_ddr_perfect_combo_chain } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { activatePiecie, useMosjeAbility } from "../../src/engine/turnManager.js";
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
    energy: 6,
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
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeJeffreySlot(mp), null],
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        energy: 6,
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
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: slots,
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        energy: 6,
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
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeTukSlot("mosje_chris", 50), null],
        piecieSlots,
      },
      player_2: {
        energy: 6,
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

  it("activates the chosen face-down Piecie for free (no Energy, even placed this turn) and Chris gains 15 MP", () => {
    const placedNow = (cardId: string) => ({ ...makeFaceDownPiecieSlot(cardId), playedOnTurn: 5, canActivateOnTurn: 6 });
    const state = makeChrisState([placedNow("piecie_broodje_doner"), placedNow("piecie_te_hard_gaan"), placedNow("piecie_kannetje_melk")]);
    state._pendingTargets = { piecie_slot: 1 };

    const res = useMosjeAbility(state, "player_1", "mosje_chris");

    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(65); // 50 + 15
    expect(res.state.players.player_1.energy).toBe(6); // free: nothing paid
    expect(res.state.players.player_1.piecieSlots[1]?.cardId).not.toBe("piecie_te_hard_gaan");
    expect(res.state.players.player_1.piecieSlots[0]?.cardId).toBe("piecie_broodje_doner"); // others untouched
  });

  it("falls back to the first slot when no selection is given (bot-safe)", () => {
    const state = makeChrisState([makeFaceDownPiecieSlot("piecie_broodje_doner"), makeFaceDownPiecieSlot("piecie_te_hard_gaan"), makeFaceDownPiecieSlot("piecie_kannetje_melk")]);
    const res = useMosjeAbility(state, "player_1", "mosje_chris");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.piecieSlots[0]?.cardId).not.toBe("piecie_broodje_doner");
  });

  it("is refused (nothing spent, no MP) with only 2 face-down Piecies, and works once per turn", () => {
    const two = makeChrisState([makeFaceDownPiecieSlot("piecie_broodje_doner"), makeFaceDownPiecieSlot("piecie_te_hard_gaan"), null]);
    const r = useMosjeAbility(two, "player_1", "mosje_chris");
    expect(r.success).toBe(false);
    expect(two.players.player_1.activeSlots[0].mp).toBe(50);
    const three = makeChrisState([makeFaceDownPiecieSlot("piecie_broodje_doner"), makeFaceDownPiecieSlot("piecie_te_hard_gaan"), makeFaceDownPiecieSlot("piecie_kannetje_melk")]);
    const once = useMosjeAbility(three, "player_1", "mosje_chris");
    expect(useMosjeAbility(once.state, "player_1", "mosje_chris").success).toBe(false);
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
  it("uses the Card List 2.0 Perfect Setup text (3 face-down Piecies gate, free activation)", () => {
    const chris = MOSJES.find((m: any) => m.id === "mosje_chris");
    expect(chris).toBeTruthy();
    // NOTE: the 2.0 text promises "gain 15 MP"; the engine still grants none (V4 ruling,
    // asserted above). That text<->engine gap is tracked, not asserted here.
    expect(chris.abilityDescription).toContain("Perfect Setup");
    expect(chris.abilityDescription.toLowerCase()).toContain("face-down piecies");
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
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeJiscaSlot("mosje_jisca", 50), null],
        piecieSlots,
      },
      player_2: {
        energy: 6,
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
  // 58-06: the V4 manual button (roll, unlock a face-down Piecie, +flags) is gone. The real behaviour is the
  // piecieActivated trigger, covered in tests/abilities/mosjes-deck3-chain.test.ts and free-activation-chain.test.ts.
  it("the manual ability entry is a no-op passthrough (Perfect Combo is a trigger now)", () => {
    const state = makeJiscaState([makeFaceDownPiecieSlot("piecie_a"), null, null, null]);
    expect(ability_jisca_perfect_combo(state, "player_1")).toBe(state);
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

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 9/10
// FPS Coert — Headshot Precision: TEXT WINS (the abilityDescription was already
// correct — only the implementation was stale, a manual flat -25 MP to opponent).
// Auto-trigger after a Physical/Technical Quest SUCCESS: roll 1d6, on 6 -> FPS
// Coert +30 MP, opponent's first active Mosje -15 MP. Wired through
// applyMosjeFieldEffectsOnQuest (questLogic.js), the same hook Michelle/Jeffrey use.
// ─────────────────────────────────────────────────────────────

function makeFpsCoertSlot(cardId: string, mp = 50) {
  return {
    cardId,
    name: cardId,
    mp,
    level: 1,
    isDefeated: false,
    traits: { physical: 2, technical: 2, social: 2 }, // 2 stars => 2 dice, so the Skilled Quests can be won
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makeFpsCoertState(mp = 50, oppMp = 100) {
  return {
    activePlayerId: "player_1",
    turnNumber: 3,
    sharedGeneralQuestDeck: [] as any[],
    players: {
      player_1: {
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        discard: [] as any[],
        activeSlots: [makeFpsCoertSlot("mosje_fps_coert", mp), null],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
      player_2: {
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        discard: [] as any[],
        activeSlots: [makeFpsCoertSlot("mosje_opponent", oppMp), null],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
    },
  } as any;
}

// 2.0 Quests (Card List): Physical = Arm Wrestling (win +40 / lose -30), Technical = Hack Mainframe (+40 / -30),
// Social = Inspire the Crowd (+25 / -15). forceQuestResult rolls the real 2.0 attempt with forced dice.
const FPS_QUEST: Record<string, string> = {
  Physical: "quest_arm_wrestling",
  Technical: "quest_hack_mainframe",
  Social: "quest_inspire_crowd",
};
function fpsQuest(state: any, category: string, win: boolean) {
  return forceQuestResult(state, "player_1", { questId: FPS_QUEST[category], win });
}

describe("FPS Coert — Headshot Precision (auto quest-success trigger)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rolling a 6 after a Physical Quest success grants +30 MP and opponent -15 MP", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeFpsCoertState(10, 100); // 10 + Arm Wrestling win 40 + Headshot 30 = 80

    const next = fpsQuest(state, "Physical", true);

    expect(next.players.player_1.activeSlots[0].mp).toBe(80);
    expect(next.players.player_2.activeSlots[0].mp).toBe(85);
  });

  it("rolling a 6 after a Technical Quest success also fires", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeFpsCoertState(10, 100); // 10 + Hack Mainframe win 40 + Headshot 30 = 80

    const next = fpsQuest(state, "Technical", true);

    expect(next.players.player_1.activeSlots[0].mp).toBe(80);
    expect(next.players.player_2.activeSlots[0].mp).toBe(85);
  });

  it("does not fire for a non-Physical/Technical Quest category, even rolling a 6", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeFpsCoertState(50, 90);

    const next = fpsQuest(state, "Social", true);

    expect(next.players.player_1.activeSlots[0].mp).toBe(75); // 50 + Inspire win 25, no Headshot
    expect(next.players.player_2.activeSlots[0].mp).toBe(90);
  });

  it("does not fire on a Quest FAILURE, even rolling a 6", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeFpsCoertState(50, 90);

    const next = fpsQuest(state, "Physical", false);

    expect(next.players.player_1.activeSlots[0].mp).toBe(20); // 50 - Arm Wrestling lose 30, no Headshot
    expect(next.players.player_2.activeSlots[0].mp).toBe(90);
  });

  it("rolling below 6 has no effect", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // rollDie(6) => 1
    const state = makeFpsCoertState(10, 90);

    const next = fpsQuest(state, "Physical", true);

    expect(next.players.player_1.activeSlots[0].mp).toBe(50); // 10 + Arm Wrestling win 40, no Headshot
    expect(next.players.player_2.activeSlots[0].mp).toBe(90);
  });

  it("the manual ability entry is a no-op passthrough (mirrors ability_jeffrey_brute_force)", () => {
    const state = makeFpsCoertState();
    const result = ability_fps_coert_headshot_precision(state, "player_1");
    expect(result).toBe(state);
  });
});

describe("FPS Coert data", () => {
  it("is flagged autoAbility (hides the manual-activate button, skipped by the bot's manual-ability loop)", () => {
    const fpsCoert = MOSJES.find((m: any) => m.id === "mosje_fps_coert");
    expect(fpsCoert).toBeTruthy();
    expect(fpsCoert.autoAbility).toBe(true);
  });

  it("abilityDescription matches the Card List 2.0 text and the ruling", () => {
    const fpsCoert = MOSJES.find((m: any) => m.id === "mosje_fps_coert");
    const desc = fpsCoert.abilityDescription.toLowerCase();
    expect(desc).toContain("succeeds at a physical or technical quest");
    expect(desc).toContain("30 mp");
    expect(desc).toContain("15 mp");
  });
});

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 10/10
// Chris DDR — Perfect Combo Chain: TEXT WINS, replacing a "+5 MP per Piecie
// played" stub that matched neither the old text nor this ruling. After ANY
// Piecie this player activates, roll 1d6. On 5-6, activate another Piecie from hand for free,
// recursively, capped at 3 extra chains per turn (chrisDdrChainUsesThisTurn).
// ─────────────────────────────────────────────────────────────

function makeChrisDdrSlot(cardId: string, mp = 50) {
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

function makeChrisDdrState(opts: {
  chrisDdrAlive?: boolean;
  dj8020Alive?: boolean;
  handPiecieCount?: number;
} = {}) {
  const {
    chrisDdrAlive = true,
    dj8020Alive = false,
    handPiecieCount = 1,
  } = opts;

  const activeSlots = [
    chrisDdrAlive ? makeChrisDdrSlot("mosje_chris_ddr", 50) : makeChrisDdrSlot("mosje_other", 50),
    dj8020Alive ? makeChrisDdrSlot("mosje_dj_8020", 20) : null,
  ];

  return {
    activePlayerId: "player_1",
    turnNumber: 5,
    players: {
      player_1: {
        energy: 6,
        hand: Array.from({ length: handPiecieCount }, () => ({ cardId: "piecie_kannetje_melk", type: "PIECIE" })),
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots,
        piecieSlots: [
          { cardId: "piecie_kannetje_melk", type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 4, canActivateOnTurn: 5 },
          null, null, null,
        ],
        pieciesActivatedThisTurn: 0,
      },
      player_2: {
        energy: 6,
        hand: [] as any[],
        deck: [] as any[],
        graveyard: [] as any[],
        activeSlots: [makeChrisDdrSlot("mosje_opponent", 100), null],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe("Chris DDR — Perfect Combo Chain", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 58-06: the V4 hand-chain (3/turn, from hand) is gone; the 2.0 chain (ready Piecie on the field, 2/turn)
  // is covered in tests/abilities/mosjes-deck3-chain.test.ts.
  it("rolling below 5 does not chain", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // rollDie(6) => 1
    const state = makeChrisDdrState({ handPiecieCount: 1 });

    const result = activatePiecie(state, "player_1", 0);

    expect(result.state.players.player_1.hand.length).toBe(1); // untouched
    expect(result.state.players.player_1.ddrChainsThisTurn || 0).toBe(0);
  });

  it("a 6 never pulls a Piecie out of the hand any more (2.0: ready Piecies on the field only)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeChrisDdrState({ handPiecieCount: 1 });

    const result = activatePiecie(state, "player_1", 0);

    expect(result.state.players.player_1.hand.length).toBe(1);
    expect(result.state.players.player_1.ddrChainsThisTurn || 0).toBe(0); // no other ready Piecie: no use spent
  });

  it("does not chain at all when Chris DDR is not on the field", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = makeChrisDdrState({ chrisDdrAlive: false, handPiecieCount: 1 });

    const result = activatePiecie(state, "player_1", 0);

    expect(result.state.players.player_1.hand.length).toBe(1); // untouched
    expect(result.state.players.player_1.ddrChainsThisTurn ?? 0).toBe(0);
  });

  // DJ 80/20 +2 to the roll removed in 2.0 (Phase 58-01): not a Card List synergy.

  it("the manual ability entry is a no-op passthrough (mirrors ability_jeffrey_brute_force)", () => {
    const state = makeChrisDdrState();
    const result = ability_chris_ddr_perfect_combo_chain(state, "player_1");
    expect(result).toBe(state);
  });
});

describe("Chris DDR data", () => {
  it("is flagged autoAbility (hides the manual-activate button, skipped by the bot's manual-ability loop)", () => {
    const chrisDdr = MOSJES.find((m: any) => m.id === "mosje_chris_ddr");
    expect(chrisDdr).toBeTruthy();
    expect(chrisDdr.autoAbility).toBe(true);
  });

  it("no longer describes a flat +5 MP per Piecie played", () => {
    const chrisDdr = MOSJES.find((m: any) => m.id === "mosje_chris_ddr");
    expect(chrisDdr.abilityDescription.toLowerCase()).not.toContain("5 mp");
  });
});
