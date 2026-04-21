/**
 * Phase 9 — Simulation Starter Decks
 *
 * Three pre-built decks for balance simulation.
 * Mosjes are defined separately (they go into the game's `mosjes` array, not the drawable deck).
 * Deck arrays contain only drawable cards: piecies, snelle piecies, places, quests.
 */
import type { CardId } from "../types/card-id.js";

function id(value: string): CardId {
  return value as CardId;
}

// ─── Mosje config types ───────────────────────────────────────────────────────

export interface MosjeConfig {
  readonly cardId: CardId;
  readonly startMP: number;
}

export interface DeckConfig {
  readonly name: string;
  readonly mosjes: readonly [MosjeConfig, MosjeConfig];
  readonly deck: ReadonlyArray<CardId>;
}

// ─── Physical Force ───────────────────────────────────────────────────────────

const PHYSICAL_FORCE_MOSJES: readonly [MosjeConfig, MosjeConfig] = [
  { cardId: id("alyssa-the-bulldozer"), startMP: 10 },
  { cardId: id("jeffrey-the-strongman"), startMP: 15 }
];

const PHYSICAL_FORCE_DECK_CARDS: ReadonlyArray<CardId> = [
  // Piecies ×20 — focus: attack, momentum-gaining, substance
  id("kannetje-melk"),
  id("kannetje-melk"),
  id("kannetje-melk"),
  id("te-hard-gaan"),
  id("te-hard-gaan"),
  id("snoeiertje"),
  id("snoeiertje"),
  id("momentum-diefje"),
  id("dikke-taks"),
  id("harde-didde"),
  id("klaar-met-jou"),
  id("grammetje-pieter"),
  id("grammetje-pieter"),
  id("varkenspootjes"),
  id("tikker"),
  id("nature-s-gift"),
  id("nature-s-gift"),
  id("shoettoe"),
  id("gun-een-piece"),
  id("gun-een-piece"),
  // Snelle Piecies ×5
  id("snelle_jensen"),
  id("snelle_jensen"),
  id("snelle_bijna_welloe"),
  id("snelle_negate_elimination"),
  id("momentum-rush"),
  // Places ×3
  id("place_the_gym"),
  id("place_zo_is_natuur"),
  id("place_obby_1"),
  // Quests ×10
  id("quest_endurance_test"),
  id("quest_endurance_test"),
  id("quest_sustained_assault"),
  id("quest_shotje_obby"),
  id("quest_leap_of_faith"),
  id("quest_leap_of_faith"),
  id("quest_survive_storm"),
  id("quest_never_give_up"),
  id("quest_tough_it_out"),
  id("quest_elimination_challenge")
];

export const PHYSICAL_FORCE: DeckConfig = {
  name: "Physical Force",
  mosjes: PHYSICAL_FORCE_MOSJES,
  deck: PHYSICAL_FORCE_DECK_CARDS
};

// ─── Digital Control ──────────────────────────────────────────────────────────

const DIGITAL_CONTROL_MOSJES: readonly [MosjeConfig, MosjeConfig] = [
  { cardId: id("martin-the-historian"), startMP: 10 },
  { cardId: id("ronald-the-master-chef"), startMP: 10 }
];

const DIGITAL_CONTROL_DECK_CARDS: ReadonlyArray<CardId> = [
  // Piecies ×20
  id("kannetje-melk"),
  id("kannetje-melk"),
  id("gun-een-piece"),
  id("gun-een-piece"),
  id("gun-een-piece"),
  id("bagga-of-greed"),
  id("bagga-of-greed"),
  id("keyboard"),
  id("mouse"),
  id("controller"),
  id("afblijven"),
  id("afblijven"),
  id("stookerino"),
  id("dubbele-dosis"),
  id("dubbele-dosis"),
  id("mp-amplifier"),
  id("f1-telemetry-data"),
  id("redbull"),
  id("zie-je-die-dingetjes"),
  id("bong-hit-demolition"),
  // Snelle Piecies ×5
  id("snelle_counter_strikka"),
  id("snelle_counter_strikka"),
  id("snelle_jeweetniet"),
  id("snelle_lucky_coin"),
  id("snelle_sleutelpuntje"),
  // Places ×3
  id("place_quest_haven"),
  id("place_bank_chilling"),
  id("place_momentum_factory"),
  // Quests ×10
  id("quest_debug_system"),
  id("quest_debug_system"),
  id("quest_hack_mainframe"),
  id("quest_precision_work"),
  id("quest_precision_work"),
  id("quest_strategy_puzzle"),
  id("quest_master_plan"),
  id("quest_perfect_timing"),
  id("quest_speed_run"),
  id("quest_synergy_mastery")
];

export const DIGITAL_CONTROL: DeckConfig = {
  name: "Digital Control",
  mosjes: DIGITAL_CONTROL_MOSJES,
  deck: DIGITAL_CONTROL_DECK_CARDS
};

// ─── Artistic Rhythm ──────────────────────────────────────────────────────────

const ARTISTIC_RHYTHM_MOSJES: readonly [MosjeConfig, MosjeConfig] = [
  { cardId: id("dj-8020"), startMP: 20 },
  { cardId: id("jisca-the-maestro"), startMP: 0 }
];

const ARTISTIC_RHYTHM_DECK_CARDS: ReadonlyArray<CardId> = [
  // Piecies ×20
  id("kannetje-melk"),
  id("kannetje-melk"),
  id("warm-kannetje-melk"),
  id("warm-kannetje-melk"),
  id("broodje-doner"),
  id("broodje-doner"),
  id("nature-s-gift"),
  id("gun-een-piece"),
  id("gun-een-piece"),
  id("bowie-stormey"),
  id("bowie-stormey"),
  id("gekke-vogels"),
  id("synergy-field"),
  id("dubbele-dosis"),
  id("dubbele-dosis"),
  id("dubbele-ding"),
  id("mosje-shield"),
  id("laat-me-chillen"),
  id("emergency-swap"),
  id("shoettoe"),
  // Snelle Piecies ×5
  id("snelle_jensen"),
  id("snelle_bijna_welloe"),
  id("snelle_dubbele_temminks"),
  id("snelle_dubbele_temminks"),
  id("snelle_the_protector"),
  // Places ×3
  id("place_arcade"),
  id("place_quest_haven"),
  id("place_coerts_caravan"),
  // Quests ×10
  id("quest_artistic_expression"),
  id("quest_artistic_expression"),
  id("quest_improvise"),
  id("quest_improvise"),
  id("quest_create_masterpiece"),
  id("quest_lucky_break"),
  id("quest_lucky_break"),
  id("quest_inspire_crowd"),
  id("quest_negotiation"),
  id("quest_synergy_mastery")
];

export const ARTISTIC_RHYTHM: DeckConfig = {
  name: "Artistic Rhythm",
  mosjes: ARTISTIC_RHYTHM_MOSJES,
  deck: ARTISTIC_RHYTHM_DECK_CARDS
};
