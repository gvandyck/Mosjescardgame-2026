import type { Primitive, QueryPrimitive } from "./primitive.js";
import { gainMP, loseMP, drainMP, setMP, multiplyNextMPGain } from "./mp/index.js";
import {
  drawCards,
  discardCards,
  revealTopDeck,
  lookAtTop,
  searchDeckAndDraw,
  returnToHand,
  sendToBottomOfDeck,
  discardSourceCard
} from "./cards/index.js";
import {
  destroyPlace,
  enterPlace,
  destroyPiecie,
  activateFaceDownPiecie,
  switchActiveMosje,
  sendToWelloe
} from "./board/index.js";
import { rollDie, rerollDie, chooseDieResult } from "./dice/index.js";
import { applyBuff, reduceMPLossBy, clearExpiredBuffs, negateEffect } from "./buffs/index.js";
import { ifThenElse, chain, choose, rollBranch, forEachTarget, multiplyByCount } from "./control/index.js";
import { countCardsInZone } from "./query/index.js";
import { checkPendingEffectAmount, checkEventLogThisTurn } from "./conditions/index.js";

export class UnknownPrimitiveError extends Error {
  constructor(name: string) {
    super(`Unknown primitive: ${name}`);
    this.name = "UnknownPrimitiveError";
  }
}

export class UnknownQueryError extends Error {
  constructor(name: string) {
    super(`Unknown query: ${name}`);
    this.name = "UnknownQueryError";
  }
}

export const primitiveRegistry: Readonly<Record<string, Primitive>> = Object.freeze({
  gainMP,
  loseMP,
  drainMP,
  setMP,
  multiplyNextMPGain,
  drawCards,
  discardCards,
  revealTopDeck,
  lookAtTop,
  searchDeckAndDraw,
  returnToHand,
  sendToBottomOfDeck,
  discardSourceCard,
  destroyPlace,
  enterPlace,
  destroyPiecie,
  activateFaceDownPiecie,
  switchActiveMosje,
  sendToWelloe,
  rollDie,
  rerollDie,
  chooseDieResult,
  applyBuff,
  reduceMPLossBy,
  clearExpiredBuffs,
  negateEffect,
  ifThenElse,
  chain,
  choose,
  rollBranch,
  forEachTarget,
  multiplyByCount
});

export const queryRegistry: Readonly<Record<string, QueryPrimitive>> = Object.freeze({
  countCardsInZone,
  checkPendingEffectAmount,
  checkEventLogThisTurn
});

export function resolvePrimitive(name: string): Primitive {
  const primitive = primitiveRegistry[name];
  if (primitive === undefined) {
    throw new UnknownPrimitiveError(name);
  }
  return primitive;
}

export function resolveQuery(name: string): QueryPrimitive {
  const query = queryRegistry[name];
  if (query === undefined) {
    throw new UnknownQueryError(name);
  }
  return query;
}
