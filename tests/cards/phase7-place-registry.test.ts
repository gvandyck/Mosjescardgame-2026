import { beforeAll, describe, expect, it } from "vitest";
import { clearRegistry, getAllCards } from "../../src/cards/registry/card-registry.js";
import {
  THE_GYM,
  BANK_CHILLING,
  QUEST_HAVEN,
  SKIFFA,
  OBBY_1,
  ARCADE,
  ZO_IS_NATUUR,
  THE_VOID,
  MOMENTUM_FACTORY,
  COERTS_CARAVAN,
  SYNERGY_CHAMBER,
  WELLOE_GRAVEYARD,
  DRAIN_ZONE,
  MOMENTUM_STABILIZER,
  DELLUFT
} from "../../src/cards/places/index.js";
import { registerCard } from "../../src/cards/registry/card-registry.js";

const EXPECTED_ROW_122_TO_135_PLACE_IDS = [
  "place_the_gym",
  "place_bank_chilling",
  "place_quest_haven",
  "place_skiffa",
  "place_obby_1",
  "place_arcade",
  "place_zo_is_natuur",
  "place_the_void",
  "place_momentum_factory",
  "place_coerts_caravan",
  "place_synergy_chamber",
  "place_welloe_graveyard",
  "place_drain_zone",
  "place_momentum_stabilizer"
] as const;

beforeAll(() => {
  clearRegistry();
  [
    THE_GYM,
    BANK_CHILLING,
    QUEST_HAVEN,
    SKIFFA,
    OBBY_1,
    ARCADE,
    ZO_IS_NATUUR,
    THE_VOID,
    MOMENTUM_FACTORY,
    COERTS_CARAVAN,
    SYNERGY_CHAMBER,
    WELLOE_GRAVEYARD,
    DRAIN_ZONE,
    MOMENTUM_STABILIZER,
    DELLUFT
  ].forEach((card) => registerCard(card));
});

describe("phase7 place registry audit", () => {
  it("registers all row 122-135 place IDs", () => {
    const placeIds = new Set(getAllCards().filter((card) => card.category === "place").map((card) => card.id));

    for (const id of EXPECTED_ROW_122_TO_135_PLACE_IDS) {
      expect(placeIds.has(id), `Missing place: ${id}`).toBe(true);
    }
  });

  it("registers at least 14 places", () => {
    const places = getAllCards().filter((card) => card.category === "place");
    expect(places.length).toBeGreaterThanOrEqual(14);
  });
});
