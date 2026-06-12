import type { CardId } from "../../types/card-id.js";
import type { CardPlaytestSpec } from "../types.js";

const FILLER: CardId[] = [
  "kannetje-melk" as CardId,
  "kannetje-melk" as CardId,
  "shoettoe" as CardId,
  "shoettoe" as CardId,
];

const PLAYER_MOSJES = [
  { cardId: "dj-8020" as CardId, startMP: 50 },
  { cardId: "jisca-the-maestro" as CardId, startMP: 50 },
];

const OPP_MOSJES = [
  { cardId: "martin-the-historian" as CardId, startMP: 50 },
  { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
];

export const broodjeDonerSpec: CardPlaytestSpec = {
  cardId: "broodje-doner" as CardId,
  description: "Gains 35 MP on active Mosje",
  deck: ["broodje-doner", ...FILLER] as CardId[],
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
      check: (e) => e.type === "mp_gained" && (e as any).amount === 35,
      description: "Gains 35 MP",
    },
  ],
};

export const bowieSStormeySpec: CardPlaytestSpec = {
  cardId: "bowie-stormey" as CardId,
  description: "Costs 15 MP; applies pet buff and gains 10 MP",
  deck: ["bowie-stormey", ...FILLER] as CardId[],
  mosje: { cardId: "dj-8020" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied" && (e as any).buffId === "pet_active:bowie-stormey",
      description: "Applies pet buff for Bowie & Stormey",
    },
  ],
};

export const gekkeVogelsSpec: CardPlaytestSpec = {
  cardId: "gekke-vogels" as CardId,
  description: "Costs 15 MP; applies pet buff and gains 10 MP",
  deck: ["gekke-vogels", ...FILLER] as CardId[],
  mosje: { cardId: "dj-8020" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied" && (e as any).buffId === "pet_active:gekke-vogels",
      description: "Applies pet buff for Gekke Vogels",
    },
  ],
};

export const synergyFieldSpec: CardPlaytestSpec = {
  cardId: "synergy-field" as CardId,
  description: "Costs 15 MP; forces synergies active and gains 10 MP",
  deck: ["synergy-field", ...FILLER] as CardId[],
  mosje: { cardId: "dj-8020" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied" && (e as any).buffId === "synergy_active_forced",
      description: "Applies synergy-forcing buff",
    },
  ],
};

export const dubbeleDingSpec: CardPlaytestSpec = {
  cardId: "dubbele-ding" as CardId,
  description: "Applies double-next-MP-gain buff",
  deck: ["dubbele-ding", ...FILLER] as CardId[],
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
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied" && (e as any).buffId === "double_next_mp_gain",
      description: "Applies double MP gain buff",
    },
  ],
};

export const mosjeShieldSpec: CardPlaytestSpec = {
  cardId: "mosje-shield" as CardId,
  description: "Costs 10 MP; applies welloe protection buff",
  deck: ["mosje-shield", ...FILLER] as CardId[],
  mosje: { cardId: "dj-8020" as CardId, startMP: 80 },
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
    {
      type: "event_emitted",
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied" && (e as any).buffId === "welloe_protection",
      description: "Applies welloe protection buff",
    },
  ],
};

export const laatMeChillenSpec: CardPlaytestSpec = {
  cardId: "laat-me-chillen" as CardId,
  description: "Costs 10 MP; gains 20 MP and applies untargetable buff",
  deck: ["laat-me-chillen", ...FILLER] as CardId[],
  mosje: { cardId: "dj-8020" as CardId, startMP: 80 },
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
      type: "event_emitted",
      eventType: "buff_applied",
      check: (e) => e.type === "buff_applied" && (e as any).buffId === "untargetable",
      description: "Applies untargetable buff",
    },
  ],
};

export const ARTISTIC_RHYTHM_SPECS: readonly CardPlaytestSpec[] = [
  broodjeDonerSpec,
  bowieSStormeySpec,
  gekkeVogelsSpec,
  synergyFieldSpec,
  dubbeleDingSpec,
  mosjeShieldSpec,
  laatMeChillenSpec,
];
