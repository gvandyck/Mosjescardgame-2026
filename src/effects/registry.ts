import type { Primitive } from "./primitive.js";
import { gainMP, loseMP, drainMP, setMP, multiplyNextMPGain } from "./mp/index.js";
import {
  drawCards,
  discardCards,
  revealTopDeck,
  lookAtTop,
  searchDeckAndDraw,
  returnToHand
} from "./cards/index.js";
import { destroyPlace, enterPlace, destroyPiecie, activateFaceDownPiecie } from "./board/index.js";
import { rollDie, rerollDie, chooseDieResult } from "./dice/index.js";
import { applyBuff, reduceMPLossBy, clearExpiredBuffs, negateEffect } from "./buffs/index.js";
import { ifThenElse, chain, choose, rollBranch, forEachTarget } from "./control/index.js";

export class UnknownPrimitiveError extends Error {
  constructor(name: string) {
    super(`Unknown primitive: ${name}`);
    this.name = "UnknownPrimitiveError";
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
  destroyPlace,
  enterPlace,
  destroyPiecie,
  activateFaceDownPiecie,
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
  forEachTarget
});

export function resolvePrimitive(name: string): Primitive {
  const primitive = primitiveRegistry[name];
  if (primitive === undefined) {
    throw new UnknownPrimitiveError(name);
  }
  return primitive;
}
