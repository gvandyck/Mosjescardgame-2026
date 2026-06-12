import type { EffectSource } from "./events.js";
import type { CardId } from "./card-id.js";
import type { MosjeRef } from "./events.js";

/** Minimal invocation data stored in a snelle PendingEffect (avoids circular imports). */
export interface SnelleInvocationData {
  readonly actingPlayerId: string;
  readonly actingMosjeRef: MosjeRef;
  readonly targetRef?: MosjeRef;
  readonly playerChoices?: Readonly<Record<string, unknown>>;
}

export interface PendingEffect {
  readonly id: string;
  readonly source: EffectSource;
  readonly primitive: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly canBeCountered: boolean;
  /** For snelle PendingEffects pushed onto the stack as responses. */
  readonly snelleCardId?: CardId;
  readonly snelleInvocation?: SnelleInvocationData;
  /** The id of the PendingEffect this was pushed in response to (for $pendingEffectId resolution). */
  readonly respondingToEffectId?: string;
}
