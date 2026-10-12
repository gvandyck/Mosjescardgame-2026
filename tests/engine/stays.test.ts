// E25 — Stays lifecycle (Phase 57-02, TABLE-02)
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { activatePiecie, startTurn, endTurn, playPiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { discardPiecieSlot } from "../../src/engine/table/discardPiecieSlot.js";
// @ts-expect-error
import { QUEST_CONDITIONS } from "../../src/engine/quests/questConditions.js";

const mosje = (n: string) => ({ cardId: n, name: n, mp: 50, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
function player(slots: any[]) {
  return {
    energy: 6, hand: [], deck: [{ cardId: "x" }, { cardId: "y" }, { cardId: "z" }], graveyard: [], questsCompleted: 0, questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0, pieciesActivatedThisTurn: 0, pieciesPlayedThisTurn: 0, actionsThisTurn: [],
    questPrepBonus: 0, totalDamageTaken: 0, activeSlots: [mosje("mosje_a"), null], piecieSlots: slots,
  };
}
const card = (cardId: string) => ({ cardId, type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 });
function make(cardId: string, turnNumber = 2) {
  return {
    activePlayerId: "player_1", turnNumber, activePlace: null, activeQuest: null, sharedPlaceSlot: null, status: "IN_PROGRESS",
    winnerId: null, winReason: null, _snelleFlags: {}, _pendingTargets: {}, sharedGeneralQuestDiscard: [],
    players: { player_1: player([card(cardId), null, null]), player_2: player([null, null, null]) },
  } as any;
}
const slot0 = (s: any) => s.players.player_1.piecieSlots[0];
const gy = (s: any) => s.players.player_1.graveyard.map((g: any) => g.cardId);

describe("Stays lifecycle (E25)", () => {
  it("non-Stays Piecie goes to discard at once", () => {
    const r = activatePiecie(make("piecie_kannetje_melk"), "player_1", 0);
    expect(r.success).toBe(true);
    expect(slot0(r.state)).toBeNull();
    expect(gy(r.state)).toContain("piecie_kannetje_melk");
  });

  it("endOfNextTurn stays through the opponent turn, leaves at the end of the owner's next turn", () => {
    let s = activatePiecie(make("piecie_continuous_assault"), "player_1", 0).state;
    expect(slot0(s)).toMatchObject({ stays: true, staysEnd: "endOfNextTurn", faceDown: false });
    s = endTurn(s); // owner's endTurn, same round
    expect(slot0(s)?.cardId).toBe("piecie_continuous_assault");
    s = { ...s, activePlayerId: "player_2" };
    s = endTurn(s); // opponent's turn ends -> new round
    expect(slot0(s)?.cardId).toBe("piecie_continuous_assault");
    s = { ...s, activePlayerId: "player_1" };
    s = endTurn(s); // owner's next turn ends
    expect(slot0(s)).toBeNull();
    expect(gy(s)).toContain("piecie_continuous_assault");
  });

  it("startOfNextTurn stays through the opponent turn, leaves at the owner's next startTurn", () => {
    let s = activatePiecie(make("piecie_afblijven"), "player_1", 0).state;
    s = endTurn(s);
    expect(slot0(s)?.cardId).toBe("piecie_afblijven");
    s = { ...s, activePlayerId: "player_2", turnNumber: 3 };
    s = endTurn(s);
    expect(slot0(s)?.cardId).toBe("piecie_afblijven");
    s = startTurn({ ...s, activePlayerId: "player_1", turnNumber: 3 });
    expect(slot0(s)).toBeNull();
    expect(gy(s)).toContain("piecie_afblijven");
  });

  it("custom stays until discardPiecieSlot removes it", () => {
    let s = activatePiecie(make("piecie_call_of_welloes"), "player_1", 0).state;
    s = endTurn(s);
    s = endTurn({ ...s, activePlayerId: "player_1", turnNumber: 3 });
    expect(slot0(s)?.cardId).toBe("piecie_call_of_welloes");
    s = discardPiecieSlot(s, "player_1", 0);
    expect(slot0(s)).toBeNull();
    expect(gy(s)).toContain("piecie_call_of_welloes");
  });

  it("a Stays slot counts as filled: the 4th Piecie is refused", () => {
    const s = make("piecie_continuous_assault");
    s.players.player_1.piecieSlots = [
      { ...card("piecie_continuous_assault"), stays: true, staysEnd: "endOfNextTurn", faceDown: false, activated: true },
      card("piecie_kannetje_melk"), card("piecie_redbull"),
    ];
    s.players.player_1.hand = [{ cardId: "piecie_quest_prep" }];
    const before = JSON.stringify(s);
    const r = playPiecie(s, "player_1", { cardId: "piecie_quest_prep" }, { id: "piecie_quest_prep", type: "PIECIE" });
    expect(r.success).toBe(false);
    expect(r.error).toBe("You can place up to 3 Piecies");
    expect(JSON.stringify(r.state.players.player_1.piecieSlots)).toBe(JSON.stringify(s.players.player_1.piecieSlots));
    expect(r.state.players.player_1.hand).toEqual([{ cardId: "piecie_quest_prep" }]);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("piecie_stays condition reads the slot flag only", () => {
    const ctx = (entry: any) => { const s = make("x"); s.players.player_1.piecieSlots = [entry, null, null]; return { state: s, playerId: "player_1" }; };
    expect(QUEST_CONDITIONS.piecie_stays(ctx({ ...card("piecie_continuous_assault"), stays: true, faceDown: false }))).toBe(true);
    expect(QUEST_CONDITIONS.piecie_stays(ctx({ ...card("piecie_continuous_assault"), faceDown: false }))).toBe(false);
  });
});
