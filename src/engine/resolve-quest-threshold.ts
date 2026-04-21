import type { MosjeInstance } from "../types/mosje-instance.js";
import type { QuestDefinition } from "../cards/schema/quest-definition.js";

function getTraitStars(mosje: MosjeInstance): 1 | 2 | 3 {
  const traits = (mosje.flags.traits as Readonly<Record<string, number>> | undefined) ?? {};
  const maxStars = Object.values(traits).reduce((max, value) => Math.max(max, Number(value)), 1);
  if (maxStars >= 3) return 3;
  if (maxStars >= 2) return 2;
  return 1;
}

export function resolveQuestThreshold(
  quest: QuestDefinition,
  mosje: MosjeInstance,
  rollResult: number
): "success" | "failure" {
  if (quest.roll === undefined) {
    return rollResult > 0 ? "success" : "failure";
  }

  const stars = getTraitStars(mosje);
  const threshold = quest.roll.thresholds[String(stars) as "1" | "2" | "3"];
  return rollResult >= threshold ? "success" : "failure";
}
