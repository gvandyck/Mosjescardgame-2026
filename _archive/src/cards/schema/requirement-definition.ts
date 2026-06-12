// For card-side requirements that gate activation (separate from costs).
export interface RequirementDefinition {
  readonly type: "trait" | "level" | "mp" | "card_in_play" | "place_active" | "custom";
  readonly params: Readonly<Record<string, unknown>>;
}
