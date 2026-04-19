// deckEngine.js — Shuffle, draw, and discard functions.
// Operates purely on card arrays — no visuals, no Firebase.
// All functions return new arrays (they do not mutate the originals).

import { getCardById } from '../data/cardIndex.js';

console.log('[ENGINE] deckEngine.js loaded');

// ─────────────────────────────────────────────────────────────
// shuffleDeck
// Returns a new array with the same cards in a random order.
// Uses the Fisher-Yates algorithm — fair and well-tested.
// ─────────────────────────────────────────────────────────────
export function shuffleDeck(cards) {
  const deck = [...cards]; // copy so we don't mutate the original
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  console.log('[ENGINE] Deck shuffled, size:', deck.length);
  return deck;
}

// ─────────────────────────────────────────────────────────────
// drawCards
// Draws `count` cards from the top of a deck.
// Returns { drawn, remaining }
//   drawn     — array of cards taken from the top
//   remaining — the deck with those cards removed
//
// If the deck runs out mid-draw, returns only what was available.
// ─────────────────────────────────────────────────────────────
export function drawCards(deck, count) {
  const available = Math.min(count, deck.length);
  if (available < count) {
    console.log(`[ENGINE] Deck only has ${deck.length} cards — drawing ${available} instead of ${count}`);
  }
  const drawn = deck.slice(0, available);
  const remaining = deck.slice(available);
  console.log('[ENGINE] Drew', drawn.length, 'card(s). Deck remaining:', remaining.length);
  return { drawn, remaining };
}

// ─────────────────────────────────────────────────────────────
// discardCards
// Moves cards from one array to the top of a discard pile.
// Returns the new discard pile (cards added to the front = most recent on top).
// ─────────────────────────────────────────────────────────────
export function discardCards(discard, cards) {
  console.log('[ENGINE] Discarding', cards.length, 'card(s)');
  return [...cards, ...discard];
}

// ─────────────────────────────────────────────────────────────
// removeFromHand
// Removes a specific card from the hand by its cardId.
// Returns { newHand, removedCard }
// removedCard is null if the card wasn't found.
// ─────────────────────────────────────────────────────────────
export function removeFromHand(hand, cardId) {
  const index = hand.findIndex(c => c.cardId === cardId);
  if (index === -1) {
    console.log('[ENGINE] Card not found in hand:', cardId);
    return { newHand: hand, removedCard: null };
  }
  const newHand = [...hand];
  const [removedCard] = newHand.splice(index, 1);
  console.log('[ENGINE] Removed from hand:', cardId);
  return { newHand, removedCard };
}

// ─────────────────────────────────────────────────────────────
// rollDie
// Rolls a single N-sided die (default: 6-sided).
// Returns an integer 1 to sides.
// ─────────────────────────────────────────────────────────────
export function rollDie(sides = 6) {
  const result = Math.floor(Math.random() * sides) + 1;
  console.log(`[ENGINE] Rolled d${sides}: ${result}`);
  return result;
}

function expandEntries(entries = []) {
  const expanded = [];
  for (const entry of entries) {
    if (typeof entry === 'string') {
      expanded.push(entry);
      continue;
    }
    if (!entry || !entry.id) continue;
    const qty = Number.isInteger(entry.qty) ? entry.qty : 1;
    for (let i = 0; i < qty; i++) expanded.push(entry.id);
  }
  return expanded;
}

// Build a player draw deck from starter deck config.
// Includes Piecie/Snelle/Place, optional MOSJES, and PERSONAL quests only.
export function buildDeck(starterDeckConfig, options = {}) {
  const includeMosjes = options.includeMosjes !== false;
  const excludedCardIds = new Set(Array.isArray(options.excludeCardIds) ? options.excludeCardIds : []);
  const cards = [];

  if (includeMosjes) {
    for (const cardId of expandEntries(starterDeckConfig?.mosjes || [])) {
      if (excludedCardIds.has(cardId)) continue;
      cards.push({ cardId, type: 'MOSJE', faceDown: false, turnsOnField: 0 });
    }
  }

  for (const cardId of expandEntries(starterDeckConfig?.piecies || [])) {
    if (excludedCardIds.has(cardId)) continue;
    cards.push({ cardId, type: 'PIECIE', faceDown: false, turnsOnField: 0 });
  }

  for (const cardId of expandEntries(starterDeckConfig?.snellePiecies || [])) {
    if (excludedCardIds.has(cardId)) continue;
    cards.push({ cardId, type: 'SNELLE_PIECIE', faceDown: false, turnsOnField: 0 });
  }

  for (const cardId of expandEntries(starterDeckConfig?.places || [])) {
    if (excludedCardIds.has(cardId)) continue;
    cards.push({ cardId, type: 'PLACE', faceDown: false, turnsOnField: 0 });
  }

  for (const cardId of expandEntries(starterDeckConfig?.quests || [])) {
    if (excludedCardIds.has(cardId)) continue;
    const card = getCardById(cardId);
    if (card?.questType === 'PERSONAL') {
      cards.push({ cardId, type: 'QUEST', faceDown: false, turnsOnField: 0 });
    } else {
      console.warn(`[DECK] Blocked General Quest from player deck: ${cardId}`);
    }
  }

  console.log(`[DECK] Built player deck: ${cards.length} cards`);
  return shuffleDeck(cards);
}
