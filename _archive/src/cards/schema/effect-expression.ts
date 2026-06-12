// A serializable descriptor that the executor resolves into a primitive call.
// THIS IS THE KEY TYPE — every card's effects are arrays of these.
export interface EffectExpression {
  readonly primitive: string;
  readonly params: Readonly<Record<string, unknown>>;
}
