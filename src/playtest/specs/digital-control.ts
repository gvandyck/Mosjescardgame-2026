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
  { cardId: "martin-the-historian" as CardId, startMP: 50 },
  { cardId: "ronald-the-master-chef" as CardId, startMP: 50 },
];

const OPP_MOSJES = [
  { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
  { cardId: "jeffrey-the-strongman" as CardId, startMP: 50 },
];

export const baggazOfGreedSpec: CardPlaytestSpec = {
  cardId: "bagga-of-greed" as CardId,
  description: "Draws cards and discards cards (hand cycling)",
  deck: ["bagga-of-greed", ...FILLER] as CardId[],
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
      check: (e) => e.type === "card_drawn",
      description: "Draws at least one card",
    },
  ],
};

export const keyboardSpec: CardPlaytestSpec = {
  cardId: "keyboard" as CardId,
  description: "Gains MP and draws cards (conditional or direct)",
  deck: ["keyboard", ...FILLER] as CardId[],
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

export const mouseSpec: CardPlaytestSpec = {
  cardId: "mouse" as CardId,
  description: "Gains MP with conditional logic",
  deck: ["mouse", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
  ],
};

export const controllerSpec: CardPlaytestSpec = {
  cardId: "controller" as CardId,
  description: "Gains MP based on game state",
  deck: ["controller", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
  ],
};

export const afblijvenSpec: CardPlaytestSpec = {
  cardId: "afblijven" as CardId,
  description: "Costs 10 MP; applies buff for defense/utility",
  deck: ["afblijven", ...FILLER] as CardId[],
  mosje: { cardId: "martin-the-historian" as CardId, startMP: 80 },
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
      check: (e) => e.type === "buff_applied",
      description: "Applies buff",
    },
  ],
};

export const dubbeleDosisSpec: CardPlaytestSpec = {
  cardId: "dubbele-dosis" as CardId,
  description: "Complex multi-effect card (likely chain/conditional)",
  deck: ["dubbele-dosis", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      description: "Card resolves (outcome varies by conditions)",
    },
  ],
};

export const mpAmplifierSpec: CardPlaytestSpec = {
  cardId: "mp-amplifier" as CardId,
  description: "Modifies MP gains (multiplier or boost)",
  deck: ["mp-amplifier", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
  ],
};

export const f1TelemetryDataSpec: CardPlaytestSpec = {
  cardId: "f1-telemetry-data" as CardId,
  description: "Gains information or MP based on game state",
  deck: ["f1-telemetry-data", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
  ],
};

export const redbullSpec: CardPlaytestSpec = {
  cardId: "redbull" as CardId,
  description: "Substance card (likely MP-related effect)",
  deck: ["redbull", ...FILLER] as CardId[],
  mosje: PLAYER_MOSJES[0],
  opponentMosje: OPP_MOSJES[0],
  expectations: [
    {
      type: "card_resolved",
      outcome: "success",
      description: "Card resolves successfully",
    },
  ],
};

export const DIGITAL_CONTROL_SPECS: readonly CardPlaytestSpec[] = [
  baggazOfGreedSpec,
  keyboardSpec,
  mouseSpec,
  controllerSpec,
  afblijvenSpec,
  dubbeleDosisSpec,
  mpAmplifierSpec,
  f1TelemetryDataSpec,
  redbullSpec,
];
