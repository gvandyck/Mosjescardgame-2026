---
status: complete
phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load
source: [46-01-SUMMARY.md, 46-02-SUMMARY.md, 46-03-SUMMARY.md]
started: 2026-07-19T00:00:00Z
updated: 2026-07-19T20:34:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Booster-only availability
expected: The four new Piecies (Loaded Dice, Boosterpackkie, Perfect Rhythm, Dikke Plaat) appear only via booster packs — never in starting decks/hands. Each is free to play (no MP cost) and shows placeholder art on a normal UTILITY Piecie card frame.
result: pass

### 2. Loaded Dice — Quest roll bonus
expected: Playing Loaded Dice gives your next Quest roll this turn +1. With a JEFFREY-family Mosje on your field, the bonus is +2 instead. The bonus applies only to the next roll this turn, not later turns.
result: pass

### 3. Boosterpackkie — draw + Coert kicker
expected: Playing Boosterpackkie draws 1 card, then rolls a die — on 5-6 you draw 1 more. With a COERT-family Mosje on your field you also gain 10 MP (capped gain, no level-up from it).
result: pass
reported: "no boosterpackie change; draws 1 card, then rolls a die — With a COERT-family Mosje on your field on 5-6 you draw 1 more. (Clarified: COERT keeps the 10 MP kicker too — COERT gates BOTH the 5-6 bonus draw and the 10 MP.)"
severity: major
resolution: "Implemented by 46-02 and re-verified by 46-03."

### 4. Perfect Rhythm — delayed draw
expected: Playing Perfect Rhythm does nothing immediately by itself, but the NEXT Piecie you activate later this turn draws you 1 card. It does not trigger off itself, triggers exactly once, and if you activate no further Piecie this turn the effect is gone next turn.
result: pass
reported: "it sounds so weak hmm..maybe draw 1 for each piecie activated - bigger payoff."
severity: major
resolution: "Implemented by 46-02 and completed for manual, duplicate-copy, and DDR-chain activations by 46-03."

### 5. Perfect Rhythm — DDR Chris kicker
expected: With the exact DDR Chris Mosje (mosje_chris_ddr) on your field, playing Perfect Rhythm also grants 10 MP. Other Chris variants (e.g. Chris All-Rounder) do NOT grant the MP.
result: pass

### 6. Dikke Plaat — Quest roll bonus
expected: Playing Dikke Plaat gives your next Quest roll this turn +1. With a DJ-family Mosje on your field, the bonus is +2 instead.
result: pass
reported: "small change; for Dikke Plaat: Alyssa Fissa Fissa should ALSO get the Bonus DJ mosje gets (shes also a DJ - cool lil secret!) (base behavior passed; this is a design addition)"
severity: minor
resolution: "Implemented and regression-tested by 46-02."

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Boosterpackkie: draw 1, roll 1d6, on 5-6 draw 1 more (for anyone); COERT Mosje on field grants +10 MP"
  status: resolved
  resolved_by: 46-02
  reason: "User reported: design change — the 5-6 bonus draw must be gated behind a COERT-family Mosje on field. Corrected design: draw 1, roll 1d6; with a COERT Mosje on field, a 5-6 draws 1 more AND grants 10 MP (kicker kept). Without COERT: only the single draw, no bonus draw, no MP."
  severity: major
  test: 3
  root_cause: "Not a defect — code implements the original Phase 46 spec. effect_boosterpackkie gives the 5-6 bonus draw unconditionally and only gates the +10 MP behind COERT; the user changed the design during UAT so COERT gates BOTH."
  artifacts:
    - path: "src/abilities/piecieEffects.js"
      issue: "effect_boosterpackkie (lines 529-550): bonus draw on roll >= 5 is unconditional; must also require hasActiveMosjeTag(player, 'COERT')"
    - path: "src/data/piecies.js"
      issue: "line 455: description text states old design"
    - path: "tests/effects/thematic-piecies.test.ts"
      issue: "asserts old behavior (bonus draw without COERT)"
    - path: "tests/ui/cards/card-registry.js"
      issue: "browser card test expectations reflect old design"
    - path: "docs/card-reference.md"
      issue: "card row describes old design"
  missing:
    - "Gate the 5-6 bonus draw behind a COERT-family Mosje on field (keep the +10 MP COERT kicker unchanged)"
    - "New description: 'Draw 1, then roll 1d6. COERT Mosje on field: on 5-6 draw 1 more, and gain 10 MP.'"
    - "Update Vitest, card-registry, and card-reference to the new design"
  debug_session: ""  # design change — no debug session needed

- truth: "Perfect Rhythm: the next later Piecie activation this turn draws 1 (one-shot)"
  status: resolved
  resolved_by: 46-02
  reason: "User reported: design change — one-shot feels too weak. Corrected design: draw 1 for EACH Piecie activated later this turn (repeating trigger until end of turn), bigger payoff. Still does not trigger off itself; cleared at end of turn."
  severity: major
  test: 4
  root_cause: "Not a defect — code implements the original one-shot spec. effect_perfect_rhythm sets a boolean (perfectRhythmDrawNextPiecie) that turnManager consumes on the first later activation; the user rebalanced the card during UAT to draw on EVERY later Piecie activation this turn."
  artifacts:
    - path: "src/abilities/piecieEffects.js"
      issue: "effect_perfect_rhythm (lines 552-565): sets one-shot flag; behavior itself stays, but flag semantics change to turn-persistent"
    - path: "src/engine/turnManager.js"
      issue: "lines 964-965 consume (clear) perfectRhythmDrawNextPiecie after first draw — must NOT clear on consumption; line 498 end-of-turn clear stays"
    - path: "src/data/piecies.js"
      issue: "line 470: description says 'next Piecie activation'"
    - path: "tests/effects/thematic-piecies.test.ts"
      issue: "asserts exactly-once consumption"
    - path: "tests/ui/cards/card-registry.js"
      issue: "browser card test expectations reflect one-shot design"
    - path: "docs/card-reference.md"
      issue: "card row describes one-shot design"
  missing:
    - "Make the draw repeat: every later Piecie activation this turn draws 1 (remove consumption at turnManager.js:964-965; keep end-of-turn clear and no self-trigger)"
    - "New description: 'Each later Piecie you activate this turn also draws 1. Dancing/DDR Chris on field: also gain 10 MP.'"
    - "Update Vitest, card-registry, and card-reference to the repeating design"
  debug_session: ""  # design change — no debug session needed

- truth: "Dikke Plaat: +1 next Quest roll, +2 with a DJ-family Mosje on field"
  status: resolved
  resolved_by: 46-02
  reason: "User reported: design addition — [Alyssa] Fissa Fissa! (mosje_alyssa_fissa) should ALSO grant the +2 DJ bonus even though she is not DJ-tagged (she's secretly a DJ — hidden flavour). Base behavior passed."
  severity: minor
  test: 6
  root_cause: "Not a defect — effect_dikke_plaat only checks the DJ tag family; the user added an exact-Mosje exception during UAT (mirrors the existing exact mosje_chris_ddr exception pattern in effect_perfect_rhythm)."
  artifacts:
    - path: "src/abilities/piecieEffects.js"
      issue: "effect_dikke_plaat (from line 567): +2 condition must be hasActiveMosjeTag(player, 'DJ') OR an active non-defeated slot with cardId === 'mosje_alyssa_fissa'"
    - path: "src/data/piecies.js"
      issue: "line 485: description must mention the Alyssa Fissa exception, e.g. 'DJ Mosje or [Alyssa] Fissa Fissa! on field: +2 instead.'"
    - path: "tests/effects/thematic-piecies.test.ts"
      issue: "add coverage: Alyssa Fissa Fissa on field grants +2; other ALYSSA (Bulldozer) stays +1"
    - path: "docs/card-reference.md"
      issue: "card row + thematic notes should record the Alyssa Fissa exception"
  missing:
    - "Extend the +2 gate with an exact mosje_alyssa_fissa exception"
    - "Mention the exception on the card text (user clarified: do NOT hide it) — 'DJ Mosje or [Alyssa] Fissa Fissa! on field: +2 instead.'"
    - "Add Vitest cases for the Alyssa Fissa exception and the Bulldozer non-match"
  debug_session: ""  # design change — no debug session needed
