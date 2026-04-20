import type { EffectSource } from "./events.js";

export interface PendingEffect {
  readonly id: string;
  readonly source: EffectSource;
  readonly primitive: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly canBeCountered: boolean;
}
