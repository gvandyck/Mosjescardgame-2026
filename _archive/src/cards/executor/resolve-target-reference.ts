import type { MosjeRef } from "../../types/events.js";
import type { TargetDefinition } from "../schema/target-definition.js";
import type { GameState } from "../../types/game-state.js";
import type { TriggerType } from "../schema/card-definition-types.js";

export interface CardInvocation {
  readonly actingPlayerId: string;
  readonly actingMosjeRef: MosjeRef;
  readonly targetRef?: MosjeRef;
  readonly playerChoices?: Readonly<Record<string, unknown>>;
  readonly isSnelle?: boolean;
  readonly triggerOverride?: TriggerType;
}

export class MissingTargetError extends Error {
  constructor(targetDef: TargetDefinition) {
    super(`Card requires a target (${targetDef}) but invocation.targetRef was not provided`);
    this.name = "MissingTargetError";
  }
}

export class UnknownPlaceholderError extends Error {
  constructor(placeholder: string) {
    super(`Unknown '$'-placeholder: ${placeholder}`);
    this.name = "UnknownPlaceholderError";
  }
}

export class UntargetableError extends Error {
  constructor(targetRef: MosjeRef) {
    super(
      `Target mosje '${targetRef.instanceId}' (player '${targetRef.playerId}') is untargetable`
    );
    this.name = "UntargetableError";
  }
}

/**
 * Throws UntargetableError if the given mosje has an active 'buff:untargetable' flag.
 * Called for every explicitly-targeted opponent/any/required mosje.
 */
function assertTargetable(state: GameState, targetRef: MosjeRef): void {
  const player = state.players.find((p) => p.id === targetRef.playerId);
  const mosje = player?.mosjes.find((m) => m.instanceId === targetRef.instanceId);
  if (mosje === undefined) return;
  const buff = mosje.flags["buff:untargetable"] as { expiryTurn?: number } | undefined;
  if (buff === undefined) return;
  // Active if no expiry or has not yet expired
  if (buff.expiryTurn === undefined || buff.expiryTurn >= state.turnCount) {
    throw new UntargetableError(targetRef);
  }
}

/**
 * Resolves the target MosjeRef that a card needs based on its TargetDefinition
 * and the provided invocation.
 *
 * - Targets that always resolve to $self: 'self_active_mosje', 'none'
 * - Targets that require invocation.targetRef: 'opponent_active_mosje', 'any_mosje', 'required_mosje'
 * - 'self_or_ally_mosje': prefers targetRef if provided, falls back to actingMosjeRef
 * - 'all_opponents', 'all_mosjes', 'shared_field': no single MosjeRef; return undefined
 */
export function resolveTargetReference(
  state: GameState,
  target: TargetDefinition,
  invocation: CardInvocation
): MosjeRef | undefined {
  switch (target) {
    case "none":
    case "self":
    case "self_active_mosje":
    case "any_active_mosje":
      return invocation.actingMosjeRef;

    case "opponent_active_mosje":
    case "any_mosje":
    case "required_mosje":
      if (invocation.targetRef === undefined) throw new MissingTargetError(target);
      assertTargetable(state, invocation.targetRef);
      return invocation.targetRef;

    case "self_or_ally_mosje":
      return invocation.targetRef ?? invocation.actingMosjeRef;

    case "all_opponents":
    case "all_mosjes":
    case "shared_field":
      // These are multi-target; the executor handles them specially
      return undefined;

    default: {
      // exhaustive check
      const _: never = target;
      return _;
    }
  }
}
