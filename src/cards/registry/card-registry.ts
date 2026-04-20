import type { CardCategory } from "../schema/card-definition-types.js";
import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";

export class DuplicateCardError extends Error {
  constructor(id: CardId) {
    super(`Card already registered: ${id}`);
    this.name = "DuplicateCardError";
  }
}

export class UnknownCardError extends Error {
  constructor(id: CardId) {
    super(`Unknown card: ${id}`);
    this.name = "UnknownCardError";
  }
}

export class RegistryFrozenError extends Error {
  constructor() {
    super("Card registry is frozen — registerCard is not allowed after freezeRegistry()");
    this.name = "RegistryFrozenError";
  }
}

// Module-level mutable state — intentionally isolated to this module.
let registry: Map<CardId, CardDefinition> = new Map();
let frozen = false;

export function registerCard(card: CardDefinition): void {
  if (frozen) throw new RegistryFrozenError();
  if (registry.has(card.id)) throw new DuplicateCardError(card.id);
  registry.set(card.id, card);
}

export function getCard(id: CardId): CardDefinition {
  const card = registry.get(id);
  if (card === undefined) throw new UnknownCardError(id);
  return card;
}

export function hasCard(id: CardId): boolean {
  return registry.has(id);
}

export function getAllCards(): ReadonlyArray<CardDefinition> {
  return Array.from(registry.values());
}

export function getCardsByCategory(category: CardCategory): ReadonlyArray<CardDefinition> {
  return Array.from(registry.values()).filter((card) => card.category === category);
}

/** Test-only — resets registry and frozen state. */
export function clearRegistry(): void {
  registry = new Map();
  frozen = false;
}

/** Internal — called by freeze-after-boot.ts only. */
export function _setFrozen(): void {
  frozen = true;
}
