// Trait type used by cost requirements
export type Trait = string;

export interface CostDefinition {
  readonly type: "free" | "mp" | "discard" | "combo" | "variable";
  readonly mp?: number;
  readonly discardCount?: number;
  readonly traitRequirements?: ReadonlyArray<{ readonly trait: Trait; readonly minStars: 1 | 2 | 3 }>;
  readonly levelRequirement?: 1 | 2 | 3;
  readonly comboRequirement?: string; // e.g. 'place == bank_chilling'
}
