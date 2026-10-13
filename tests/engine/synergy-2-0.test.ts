// EFX-05 (Phase 58-01): 2.0 synergy holder texts + passive Synergy Chamber.
import { describe, expect, it, vi, afterEach } from "vitest";
// @ts-expect-error - JS module
import { isHolderTextActive } from "../../src/engine/synergy/isHolderTextActive.js";
// @ts-expect-error - JS module
import { getActiveSynergies } from "../../src/engine/synergyResolver.js";
// @ts-expect-error - JS module
import { getPartnerSynergyQuestBonus } from "../../src/abilities/questLogic.js";
// @ts-expect-error - JS module
import { playPiecie, startTurn } from "../../src/engine/turnManager.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";

function slot(cardId: string, mp = 40, extra: Record<string, unknown> = {}) {
  return { cardId, name: cardId, subtype: "FIGHTING", traits: { physical: 2, technical: 2, mental: 2 }, mp, level: 1,
    isDefeated: false, statusEffects: [] as unknown[], abilityUsedThisTurn: false, ...extra };
}
function makeState(mine: any[], place: string | null = null, hand: any[] = []) {
  const side = (activeSlots: any[], h: any[] = []) => ({ name: "P", hand: h, deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }], graveyard: [],
    activeSlots, piecieSlots: [null, null, null, null], questsCompleted: 0, questsCompletedThisTurn: 0, energy: 5, pieciesPlayedThisTurn: 0 });
  return { status: "ACTIVE", activePlayerId: "player_1", firstPlayerId: "player_2", turnNumber: 3, activePlace: place,
    players: { player_1: side(mine, hand), player_2: side([slot("mosje_jeffrey"), null]) } } as any;
}

afterEach(() => vi.restoreAllMocks());

describe("isHolderTextActive: the five 2.0 pairs", () => {
  it.each([
    ["mosje_martin_historian", "mosje_cless_teacher"],
    ["mosje_martin_senor_west", "mosje_azn_cless"],
    ["mosje_youri", "mosje_chris_ddr"],
    ["mosje_fps_west", "mosje_fps_coert"],
    ["mosje_binti", "mosje_coert_tech"],
  ])("%s works with %s and not without", (holder, partner) => {
    expect(isHolderTextActive(makeState([slot(holder), slot(partner)]), "player_1", holder)).toBe(true);
    expect(isHolderTextActive(makeState([slot(holder), null]), "player_1", holder)).toBe(false);
    expect(isHolderTextActive(makeState([slot(holder), { ...slot(partner), isDefeated: true }]), "player_1", holder)).toBe(false);
    const s = makeState([slot(holder), null]); s.players.player_2.activeSlots[1] = slot(partner);
    expect(isHolderTextActive(s, "player_1", holder)).toBe(false);
  });

  it("Coert Tech is a partner, not a holder", () => {
    expect(isHolderTextActive(makeState([slot("mosje_coert_tech"), slot("mosje_binti")]), "player_1", "mosje_coert_tech")).toBe(false);
  });

  it("getActiveSynergies lists live holders only", () => {
    const syn = getActiveSynergies(makeState([slot("mosje_binti"), slot("mosje_coert_tech")]), "player_1");
    expect(syn.map((x: any) => x.holderId)).toEqual(["mosje_binti"]);
    expect(syn[0].partnerId).toBe("mosje_coert_tech");
  });
});

describe("Synergy Chamber", () => {
  it("makes a holder work without its partner, for both players", () => {
    const s = makeState([slot("mosje_binti"), null], "place_synergy_chamber");
    s.players.player_2.activeSlots[0] = slot("mosje_youri");
    expect(isHolderTextActive(s, "player_1", "mosje_binti")).toBe(true);
    expect(isHolderTextActive(s, "player_2", "mosje_youri")).toBe(true);
  });
  it("a fresh holder ignores it", () => {
    const s = makeState([slot("mosje_binti", 40, { entryProtected: true }), null], "place_synergy_chamber");
    expect(isHolderTextActive(s, "player_1", "mosje_binti")).toBe(false);
  });
});

describe("V4 pairs are gone", () => {
  it("Alyssa + Jisca give no extra MP at turn start", () => {
    const withJisca = makeState([slot("mosje_alyssa_bulldozer", 30), slot("mosje_jisca", 30)]);
    const without = makeState([slot("mosje_alyssa_bulldozer", 30), null]);
    withJisca.activePlayerId = "player_2"; without.activePlayerId = "player_2";
    const a = startTurn(withJisca, "player_1").players.player_1.activeSlots[0].mp;
    const b = startTurn(without, "player_1").players.player_1.activeSlots[0].mp;
    expect(a).toBe(b);
  });
});

describe("holder texts", () => {
  it("Senor West + AZN Cless: Physical +15 only, not Digital", () => {
    const s = makeState([slot("mosje_martin_senor_west"), slot("mosje_azn_cless")]);
    expect(getPartnerSynergyQuestBonus(s, "player_1", "Physical")).toBe(15);
    expect(getPartnerSynergyQuestBonus(s, "player_1", "Digital")).toBe(0);
    expect(getPartnerSynergyQuestBonus(s, "player_1", "Artistic")).toBe(0);
    expect(getPartnerSynergyQuestBonus(makeState([slot("mosje_martin_senor_west"), null]), "player_1", "Physical")).toBe(0);
  });

  it("FPS West + FPS Coert: a Quest win gives both +10", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.55);
    const win = (s: any) => forceQuestResult(s, "player_1", { slotIndex: 0, questId: "quest_arm_wrestling", win: true });
    const paired = win(makeState([slot("mosje_fps_west", 10), slot("mosje_fps_coert", 10)])).players.player_1.activeSlots;
    expect(paired[1].mp).toBe(20);
    const alone = win(makeState([slot("mosje_fps_west", 10), null])).players.player_1.activeSlots[0].mp;
    const cham = win(makeState([slot("mosje_fps_west", 10), null], "place_synergy_chamber")).players.player_1.activeSlots[0].mp;
    expect(cham - alone).toBe(10);
  });

  it("Youri + DDR Chris: a placed Piecie is ready at once; without DDR it waits", () => {
    const card = { cardId: "piecie_kannetje_melk", type: "PIECIE" };
    const withDdr = playPiecie(makeState([slot("mosje_youri"), slot("mosje_chris_ddr")], null, [card]), "player_1", card);
    expect(withDdr.state.players.player_1.piecieSlots.find((x: any) => x).canActivateOnTurn).toBe(3);
    const without = playPiecie(makeState([slot("mosje_youri"), null], null, [card]), "player_1", card);
    expect(without.state.players.player_1.piecieSlots.find((x: any) => x).canActivateOnTurn).toBe(4);
  });
});
