# Phase 39: Gandoe↔Michelle synergy (The Box deck) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 39-remaining-unwired-mosje-synergy-pairs-cless-teacher-azn-cles
**Areas discussed:** Roll threshold, Bonus frequency, Level-up behavior, Recipient slot (all delegated)

---

## Area Selection (single AskUserQuestion round)

Four gray areas on the NEW Michelle→Gandoe Tough-Gamble bonus were offered (the
Gandoe→Michelle Physical-Quest +15 direction was presented as a settled West+AZN-Cless
mirror needing no discussion):

| Option | Description | Selected |
|--------|-------------|----------|
| Roll threshold (5-6 vs 4-6) | Honor printed 5-6 premium, or align with the 4-6 double band | — |
| Bonus frequency (per-roll vs per-turn) | +10 every qualifying roll, or once-per-turn cap like Phase 38 Jisca | — |
| Level-up behavior of the +10 | allowLevelUp true vs false (Phase 38 precedent: false) | — |
| Which Gandoe receives it | Explicit Destroyer-slot targeting vs assumed | — |

**User's choice:** "pick for me" (full delegation — no individual area selected).
**Notes:** Consistent with the user's standing delegation pattern on the deck-completion
track ("go with what feels best for you, I trust you completely!" earlier the same day).

---

## Claude's Discretion

User delegated ALL four rulings. Claude decided (full rationale in CONTEXT.md):

- **D-01 Threshold = 5-6** (printed text; fresh mechanic, no engine divergence to defer to;
  rarer premium tier above the 4-6 double band is coherent design). Also clarified the
  "4-6 vs 5-6 mismatch" flag: the Tough Gamble double/half band itself is NOT mismatched —
  card and engine both say 4-6/1-3; 5-6 is a separate threshold for the new bonus only.
- **D-02 Per-roll, no per-turn cap** (text reads per-roll; quests are naturally scarce,
  unlike the spammable Piecie plays that justified Phase 38's cap).
- **D-03 `allowLevelUp: false`** (Phase 38 precedent: passive synergy MP never auto-levels).
- **D-04 Explicit `mosje_gandoe_destroyer` slot targeting** (never leaks to Gandoe Wizard).
- **D-05 Gandoe→Michelle = one `PARTNER_QUEST_SYNERGIES` row** (carried into decisions as
  settled, not discussed).

Also at Claude's discretion downstream: repro-spec scenario shaping, mockDiceRoll usage,
`_autoAbilityLog` phrasing for the Gandoe kicker.

## Deferred Ideas

- Non-deck synergy remainder of the original Phase 39 scope (Cless Teacher/AZN Cless,
  FPS Coert/West, Chris DDR+DJ 8020, Synergy-Chamber waiver reach) — already deferred at
  roadmap level to a future booster-card synergy-fidelity phase; reaffirmed here.
