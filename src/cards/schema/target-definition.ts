export type TargetDefinition =
  | "none"
  | "self_active_mosje"
  | "self_or_ally_mosje"
  | "opponent_active_mosje"
  | "any_mosje"
  | "all_opponents"
  | "all_mosjes"
  | "shared_field"
  | "required_mosje"; // personal quests, etc.
