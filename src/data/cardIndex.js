// cardIndex.js — Central registry for all card data.
// Imports every card array and exposes helper functions for lookup.

import { MOSJES } from "./mosjes.js";
import { PIECIES } from "./piecies.js";
import { SNELLE_PIECIES } from "./snellePiecies.js";
import { PLACES } from "./places.js";
import { QUESTS } from "./quests.js";

/** Every card in the game as a flat array. */
export const ALL_CARDS = [
  ...MOSJES,
  ...PIECIES,
  ...SNELLE_PIECIES,
  ...PLACES,
  ...QUESTS,
];

/**
 * Look up a single card by its id string.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getCardById(id) {
  return ALL_CARDS.find((card) => card.id === id);
}

/**
 * Return all cards that include the given tag in their tags array.
 * @param {string} tag  e.g. "FOOD", "ATTACK", "WEST"
 * @returns {object[]}
 */
export function getCardsByTag(tag) {
  return ALL_CARDS.filter(
    (card) => Array.isArray(card.tags) && card.tags.includes(tag)
  );
}

/**
 * Return all cards of a given type.
 * @param {"MOSJE"|"PIECIE"|"SNELLE_PIECIE"|"PLACE"|"QUEST"} type
 * @returns {object[]}
 */
export function getCardsByType(type) {
  return ALL_CARDS.filter((card) => card.type === type);
}

/**
 * Return all non-booster-only cards of a given type.
 * Useful for building starter-eligible card pools.
 * @param {"MOSJE"|"PIECIE"|"SNELLE_PIECIE"|"PLACE"|"QUEST"} type
 * @returns {object[]}
 */
export function getStarterEligible(type) {
  return ALL_CARDS.filter(
    (card) => card.type === type && !card.isBoosterOnly && !card.disabled
  );
}
