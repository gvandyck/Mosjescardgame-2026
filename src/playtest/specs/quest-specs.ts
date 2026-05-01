import type { CardId } from "../../types/card-id.js";
import type { CardPlaytestSpec } from "../types.js";

const FILLER: CardId[] = [
  "kannetje-melk" as CardId,
  "kannetje-melk" as CardId,
  "shoettoe" as CardId,
  "shoettoe" as CardId,
];

const PLAYER_MOSJES = [
  { cardId: "alyssa-the-bulldozer" as CardId, startMP: 100 },
  { cardId: "jeffrey-the-strongman" as CardId, startMP: 50 },
];

const OPP_MOSJES = [
  { cardId: "martin-the-historian" as CardId, startMP: 50 },
  { cardId: "ronald-the-master-chef" as CardId, startMP: 50 },
];

export const sustainedAssaultSpec: CardPlaytestSpec = {
  cardId: "quest_sustained_assault" as CardId,
  description: "Dealt 30+ MP damage this turn",
  deck: ["te-hard-gaan", "te-hard-gaan", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Quest can be attempted after dealing damage",
    },
  ],
};

export const synergyMasterySpec: CardPlaytestSpec = {
  cardId: "quest_synergy_mastery" as CardId,
  description: "Used Mosje ability AND completed 1 Quest this turn",
  deck: ["kannetje-melk", "kannetje-melk", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[1],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest accepts requirement check",
    },
  ],
};

export const neverGiveUpSpec: CardPlaytestSpec = {
  cardId: "quest_never_give_up" as CardId,
  description: "Mosje must be exactly Level 1 AND Resilient ★★★",
  deck: [FILLER[0], FILLER[1], FILLER[2], FILLER[3]] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest processes level and trait requirements",
    },
  ],
};

export const ultimateChallengeSpec: CardPlaytestSpec = {
  cardId: "quest_ultimate_challenge" as CardId,
  description: "Any trait at ★★★ AND have 30+ MP",
  deck: [FILLER[0], FILLER[1], FILLER[2], FILLER[3]] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest processes any-trait and MP requirements",
    },
  ],
};

export const lateNightQuestingSpec: CardPlaytestSpec = {
  cardId: "quest_late_night_questing" as CardId,
  description: "Activated keyboard/mouse/controller this game",
  deck: ["keyboard", "kannetje-melk", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest checks card activation history",
    },
  ],
};

export const chainMasterSpec: CardPlaytestSpec = {
  cardId: "quest_chain_master" as CardId,
  description: "Activated 3+ Piecies this turn",
  deck: ["kannetje-melk", "shoettoe", "affoe", "keyboard"] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest counts piecie activations this turn",
    },
  ],
};

export const speedRunSpec: CardPlaytestSpec = {
  cardId: "quest_speed_run" as CardId,
  description: "Activated 2+ Piecies this turn",
  deck: ["kannetje-melk", "shoettoe", "affoe", "keyboard"] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest counts piecie activations (2+) this turn",
    },
  ],
};

export const larryTemmenSpec: CardPlaytestSpec = {
  cardId: "quest_larry_temmen" as CardId,
  description: "larry-zegeltje on field or in hand",
  deck: ["larry-zegeltje", "kannetje-melk", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Quest checks for specific piecie in hand/field",
    },
  ],
};

export const QUEST_SPECS: readonly CardPlaytestSpec[] = [
  sustainedAssaultSpec,
  synergyMasterySpec,
  neverGiveUpSpec,
  ultimateChallengeSpec,
  lateNightQuestingSpec,
  chainMasterSpec,
  speedRunSpec,
  larryTemmenSpec,
];
