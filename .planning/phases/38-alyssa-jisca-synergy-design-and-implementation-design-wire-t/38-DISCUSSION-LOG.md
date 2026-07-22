# Phase 38 Discussion Log — Alyssa↔Jisca Synergy

**Date:** 2026-07-18
**Mode:** discuss (standard, interactive AskUserQuestion)

Human-reference record only. Downstream agents read `38-CONTEXT.md`.

## Round 1 — anchoring
| Question | Options presented | Chosen |
|---|---|---|
| Core mechanic | Party amplifier / Piecie combo engine / Mutual MP swing / Aggressive tempo burst | **Party amplifier** |
| Symmetry | Symmetric / Asymmetric (role-based) | **Asymmetric** |
| Power level | In-line (~+15) / Headline-stronger / Conditional big | **In-line (~+15)** |

## Round 2 — concrete effects
| Question | Options presented | Chosen |
|---|---|---|
| Alyssa side | Amplify her ability +50% / Flat party bonus +10/turn / Double her scaling | **Flat party bonus +10/turn** |
| Jisca side | Encore MP on Piecie activation / Rides the hype +10/turn / Crowd energy (Piecie discount) | **Crowd energy (Piecie discount)** → later corrected |

## Round 3 — no-op correction (Claude flagged)
Claude verified against `src/data/piecies.js`: 69/70 Piecies are `mpCost: 0` post-Phase-36, so a Piecie discount changes only ONE card — a near-total no-op (same trap as Dierenasiel). Flagged to Gandoe; kept the "reward Piecie play" fantasy but flipped mechanism discount→reward.
| Question | Options presented | Chosen |
|---|---|---|
| Jisca side (fix) | MP per Piecie played +10 / First Piecie each turn +10 / Rides the hype +10/turn / Keep discount anyway | **First Piecie each turn +10** |

## Deferred / redirected
- Jisca base-ability dice-vs-flat divergence → Phase 40 (kept decoupled by design).
- Other unwired synergies + Cless Teacher → Phase 39.
