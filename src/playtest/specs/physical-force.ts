import type { CardId } from "../../types/card-id.js";
import type { CardPlaytestSpec } from "../types.js";
import { getActiveMosjeMP } from "../inject-card.js";

const FILLER: CardId[] = [
  "kannetje-melk" as CardId,
  "kannetje-melk" as CardId,
  "shoettoe" as CardId,
  "shoettoe" as CardId,
];

const PLAYER_MOSJES = [
  { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
  { cardId: "jeffrey-the-strongman" as CardId, startMP: 50 },
];

const OPP_MOSJES = [
  { cardId: "martin-the-historian" as CardId, startMP: 50 },
  { cardId: "ronald-the-master-chef" as CardId, startMP: 50 },
];

export const kannetjeMelkSpec: CardPlaytestSpec = {
  cardId: "kannetje-melk" as CardId,
  description: "Gains 25 MP on the active Mosje",
  deck: ["kannetje-melk", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "mp_gained",
      check: (e) => e.type === "mp_gained" && (e as any).amount === 25,
      description: "Emits mp_gained event with amount=25",
    },
  ],
};

export const potOfWeedSpec: CardPlaytestSpec = {
  cardId: "pot-of-weed" as CardId,
  description: "Draws 2 cards",
  deck: ["pot-of-weed", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "card_drawn",
      check: (e) =>
        e.type === "card_drawn" && (e as any).playerId === "player1",
      description: "Emits at least one card_drawn event for player1",
    },
    {
      type: "state_change",
      check: (before, after) => {
        const beforeHandSize = before.players[0].hand.length;
        const afterHandSize = after.players[0].hand.length;
        return afterHandSize - beforeHandSize >= 2;
      },
      description: "Hand size increases by at least 2 cards",
    },
  ],
};

export const teHardGaanSpec: CardPlaytestSpec = {
  cardId: "te-hard-gaan" as CardId,
  description: "Costs 15 MP; makes opponent lose 25 MP",
  deck: ["te-hard-gaan", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "mp_lost",
      check: (e) =>
        e.type === "mp_lost" && (e as any).target.playerId === "player2",
      description: "Opponent loses MP",
    },
    {
      type: "state_change",
      check: (before, after) => {
        const beforeMP = getActiveMosjeMP(before, "player1");
        const afterMP = getActiveMosjeMP(after, "player1");
        return afterMP <= beforeMP - 15;
      },
      description: "Player loses at least 15 MP to cost",
    },
  ],
};

export const snoeiertjeSpec: CardPlaytestSpec = {
  cardId: "snoeiertje" as CardId,
  description: "Free attack that damages opponent for 15 MP and applies a buff to self for 15 MP loss at end of turn",
  deck: ["snoeiertje", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "mp_lost",
      check: (e) =>
        e.type === "mp_lost" && (e as any).target.playerId === "player2",
      description: "Opponent loses MP",
    },
    {
      type: "event_emitted",
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied",
      description: "Applies buff to self",
    },
  ],
};

export const momentumDiefjeSpec: CardPlaytestSpec = {
  cardId: "momentum-diefje" as CardId,
  description: "Costs 15 MP; drains up to 20 MP from opponent to self",
  deck: ["momentum-diefje", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 80 },
  opponentMosje: { cardId: "jeffrey-the-strongman" as CardId, startMP: 80 },
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "mp_drained",
      check: (e) => e.type === "mp_drained",
      description: "Drains MP from opponent",
    },
  ],
};

export const grammettePieterSpec: CardPlaytestSpec = {
  cardId: "grammetje-pieter" as CardId,
  description: "Gains MP and loses MP (net effect depends on implementation)",
  deck: ["grammetje-pieter", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
  ],
};

export const varkenspootjesSpec: CardPlaytestSpec = {
  cardId: "varkenspootjes" as CardId,
  description: "Conditional effect based on hand size or other criteria",
  deck: ["varkenspootjes", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Card resolves (may be success or partial depending on conditions)",
    },
  ],
};

export const tikkerSpec: CardPlaytestSpec = {
  cardId: "tikker" as CardId,
  description: "Gains MP and applies a buff to self",
  deck: ["tikker", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "mp_gained",
      check: (e) => e.type === "mp_gained",
      description: "Gains MP",
    },
  ],
};

export const natureSGiftSpec: CardPlaytestSpec = {
  cardId: "nature-s-gift" as CardId,
  description: "Conditional effect: gains MP if hand size meets condition, else draws",
  deck: ["nature-s-gift", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Card resolves (may be success or partial based on hand condition)",
    },
  ],
};

export const shoettoeSpec: CardPlaytestSpec = {
  cardId: "shoettoe" as CardId,
  description: "Gains 20 MP (requires active Mosje MP <= 29)",
  deck: ["shoettoe", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 20 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "mp_gained",
      check: (e) => e.type === "mp_gained" && (e as any).amount === 20,
      description: "Gains 20 MP",
    },
    {
      type: "state_change",
      check: (before, after) => {
        const beforeMP = getActiveMosjeMP(before, "player1");
        const afterMP = getActiveMosjeMP(after, "player1");
        return afterMP >= beforeMP + 20;
      },
      description: "Active Mosje MP increases by at least 20",
    },
  ],
};

export const warmKannetjeMelkSpec: CardPlaytestSpec = {
  cardId: "warm-kannetje-melk" as CardId,
  description: "Loses MP to draw cards",
  deck: ["warm-kannetje-melk", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "card_drawn",
      check: (e) => e.type === "card_drawn",
      description: "Draws cards",
    },
  ],
};

export const dikkeTaksSpec: CardPlaytestSpec = {
  cardId: "dikke-taks" as CardId,
  description: "Costs 25 MP, level 2+ requirement; complex effect with for-each loop",
  deck: ["dikke-taks", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Card resolves (may be rejected due to level requirement if not met)",
    },
  ],
};

export const PHYSICAL_FORCE_SPECS: readonly CardPlaytestSpec[] = [
  kannetjeMelkSpec,
  potOfWeedSpec,
  teHardGaanSpec,
  snoeiertjeSpec,
  momentumDiefjeSpec,
  grammettePieterSpec,
  varkenspootjesSpec,
  tikkerSpec,
  natureSGiftSpec,
  shoettoeSpec,
  warmKannetjeMelkSpec,
  dikkeTaksSpec,
];
