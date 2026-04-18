// quests.js — Data definitions for all Quest cards.
// Each Quest has a requirement to attempt it, an MP reward on success,
// and an MP penalty on failure.
// The requirementId and rewardId link to functions in src/abilities/questLogic.js.

export const QUESTS = [
  {
    id: "quest_arm_wrestling",
    type: "QUEST",
    name: "Arm Wrestling",
    requirementId: "req_arm_wrestling",
    // Roll a die. Target number depends on Physical trait:
    // Physical ★ = need 5+, ★★ = need 3+, ★★★ = need 2+
    requirementDescription: "Roll: Physical ★=5+, ★★=3+, ★★★=2+",
    successMP: 40,
    failureMP: -60,
    description: "Success: +40 MP. Failure: -60 MP.",
    flavourText: "Elleboog op tafel. Druk.",
    artPath: "assets/quests/arm_wrestling.png"
  },
  {
    id: "quest_quick_thinking",
    type: "QUEST",
    name: "Quick Thinking",
    requirementId: "req_quick_thinking",
    // Roll a die. Target number depends on Mental trait:
    // Mental ★ = need 5+, ★★ = need 4+, ★★★ = need 3+
    requirementDescription: "Roll: Mental ★=5+, ★★=4+, ★★★=3+",
    successMP: 20,
    failureMP: -20,
    description: "Success: +20 MP. Failure: -20 MP.",
    flavourText: "Drie seconden. Eén antwoord.",
    artPath: "assets/quests/quick_thinking.png"
  },
  {
    id: "quest_artistic_expression",
    type: "QUEST",
    name: "Artistic Expression",
    requirementId: "req_artistic_expression",
    // Requires Creative ★★ AND drawing 2 cards as the attempt action.
    requirementDescription: "Requires Creative ★★ + draw 2 cards",
    successMP: 40,
    failureMP: -10,
    description: "Success: +40 MP. Failure: -10 MP.",
    flavourText: "Laat je ziel zien.",
    artPath: "assets/quests/artistic_expression.png"
  },
  {
    id: "quest_leap_of_faith",
    type: "QUEST",
    name: "Leap of Faith",
    requirementId: "req_leap_of_faith",
    // Roll 1d6. 1-3 = Fail, 4-6 = Success. No trait modifier.
    requirementDescription: "Roll 1d6: 1-3 = Fail, 4-6 = Success",
    successMP: 60,
    failureMP: -20,
    description: "Success: +60 MP. Failure: -20 MP.",
    flavourText: "Sluit je ogen. Spring.",
    artPath: "assets/quests/leap_of_faith.png"
  }
];
