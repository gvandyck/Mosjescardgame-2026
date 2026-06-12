// Trait type used by cost requirements
export type Trait = string;

export interface CostDefinition {
  readonly type: "free" | "mp" | "discard" | "discard_food" | "combo" | "variable" | "mp_variable";
  readonly mp?: number;
  readonly amount?: number;
  readonly minMp?: number;
  readonly label?: string;
  readonly discardCount?: number;
  readonly resolver?: string;
  readonly traitRequirements?: ReadonlyArray<{ readonly trait: Trait; readonly minStars: 1 | 2 | 3 }>;
  readonly levelRequirement?: 1 | 2 | 3;
  readonly comboRequirement?: string; // e.g. 'place == bank_chilling'
}
