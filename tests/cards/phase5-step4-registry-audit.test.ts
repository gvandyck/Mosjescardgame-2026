/**
 * Phase 5 — Step 4: Snelle-Piecie Registry Audit
 *
 * Cross-references all cards in card-spec.md (Snelle Piecies section, 19 cards)
 * against the live registry. Verifies every snelle-piecie is registered with the
 * correct category before the Step 5 integration tests run.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRegistry,
  getAllCards,
  registerCard
} from "../../src/cards/registry/card-registry.js";

// ── Import all card definitions (module-level registerCard already ran once) ──
import { BIJNA_WELLOE } from "../../src/cards/snelle-piecies/bijna-welloe.js";
import { BLENSEN } from "../../src/cards/snelle-piecies/blensen.js";
import { COUNTER_STRIKKA } from "../../src/cards/snelle-piecies/counter-strikka.js";
import { DRAIN_REVERSAL } from "../../src/cards/snelle-piecies/drain-reversal.js";
import { DUBBELE_TEMMINKS } from "../../src/cards/snelle-piecies/dubbele-temminks.js";
import { EMERGENCY_HEALINGS } from "../../src/cards/snelle-piecies/emergency-healings.js";
import { FF_HAALTJE_NEMEN } from "../../src/cards/snelle-piecies/ff-haaltje-nemen.js";
import { FRENSSEN } from "../../src/cards/snelle-piecies/frenssen.js";
import { GEVALLETJE_KLAKKELOOS } from "../../src/cards/snelle-piecies/gevalletje-klakkeloos.js";
import { JAMMERTJE_GEPAKT } from "../../src/cards/snelle-piecies/jammertje-gepakt.js";
import { JANTJE_JANTJE_JANTJE } from "../../src/cards/snelle-piecies/jantje-jantje-jantje.js";
import { JE_WEET_NIET } from "../../src/cards/snelle-piecies/je-weet-niet.js";
import { JENSEN } from "../../src/cards/snelle-piecies/jensen.js";
import { LUCKY_COIN } from "../../src/cards/snelle-piecies/lucky-coin.js";
import { NOT_TODAY } from "../../src/cards/snelle-piecies/not-today.js";
import { PERFECT_DODGE } from "../../src/cards/snelle-piecies/perfect-dodge.js";
import { SLEUTELPUNTJE } from "../../src/cards/snelle-piecies/sleutelpuntje.js";
import { THE_PROTECTOR } from "../../src/cards/snelle-piecies/the-protector.js";
// momentum-rush lives in piecies/momentum-gaining/ but has category: "snelle-piecie"
import { MOMENTUM_RUSH } from "../../src/cards/piecies/momentum-gaining/momentum-rush.js";

const ALL_SNELLE_CARDS = [
  BIJNA_WELLOE,
  BLENSEN,
  COUNTER_STRIKKA,
  DRAIN_REVERSAL,
  DUBBELE_TEMMINKS,
  EMERGENCY_HEALINGS,
  FF_HAALTJE_NEMEN,
  FRENSSEN,
  GEVALLETJE_KLAKKELOOS,
  JAMMERTJE_GEPAKT,
  JANTJE_JANTJE_JANTJE,
  JE_WEET_NIET,
  JENSEN,
  LUCKY_COIN,
  NOT_TODAY,
  PERFECT_DODGE,
  SLEUTELPUNTJE,
  THE_PROTECTOR,
  MOMENTUM_RUSH
] as const;

/** IDs from card-spec.md Snelle Piecies section (rows 103-121 + Momentum Rush). */
const EXPECTED_IDS = [
  "snelle_bijna_welloe",
  "snelle_blensen",
  "snelle_counter_strikka",
  "snelle_drain_reversal",
  "snelle_dubbele_temminks",
  "snelle_emergency_healings",
  "snelle_ff_haaltje_nemen",
  "snelle_frenssen",
  "snelle_gevalletje_klakkeloos",
  "snelle_jammertje_gepakt",
  "snelle_jantje_jantje_jantje",
  "snelle_jeweetniet",
  "snelle_jensen",
  "snelle_lucky_coin",
  "snelle_negate_elimination", // not-today
  "snelle_perfect_dodge",
  "snelle_sleutelpuntje",
  "snelle_the_protector",
  "momentum-rush" // lives in piecies/momentum-gaining; category remains snelle-piecie
] as const;

describe("phase5 step4 — snelle-piecie registry audit", () => {
  beforeEach(() => {
    clearRegistry();
    for (const card of ALL_SNELLE_CARDS) {
      registerCard(card);
    }
  });

  it("exactly 19 cards are registered as snelle-piecie", () => {
    const snelle = getAllCards().filter((c) => c.category === "snelle-piecie");
    expect(snelle).toHaveLength(19);
  });

  it("all 19 expected IDs are present in the registry", () => {
    const ids = getAllCards()
      .filter((c) => c.category === "snelle-piecie")
      .map((c) => c.id);
    for (const expectedId of EXPECTED_IDS) {
      expect(ids, `Missing snelle-piecie: ${expectedId}`).toContain(expectedId);
    }
  });

  it("momentum-rush has category snelle-piecie (not piecie)", () => {
    const card = getAllCards().find((c) => c.id === "momentum-rush");
    expect(card).toBeDefined();
    expect(card!.category).toBe("snelle-piecie");
  });

  it("all 18 cards from snelle-piecies/index.ts have category snelle-piecie", () => {
    const snelleBarrelCards = ALL_SNELLE_CARDS.filter((c) => c !== MOMENTUM_RUSH);
    for (const card of snelleBarrelCards) {
      expect(card.category, `${card.id} should be snelle-piecie`).toBe("snelle-piecie");
    }
  });

  it("no snelle-piecie card is missing from getAllCards()", () => {
    const registeredIds = new Set(
      getAllCards()
        .filter((c) => c.category === "snelle-piecie")
        .map((c) => c.id)
    );
    const missing = EXPECTED_IDS.filter((id) => !registeredIds.has(id));
    expect(missing).toHaveLength(0);
  });
});
