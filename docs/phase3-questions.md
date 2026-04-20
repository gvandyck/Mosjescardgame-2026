# Phase 3 Questions

## Q1: Cost Refund on Failure (documented decision)
**Decision made — no refund.** Costs commit before effects run. If an effect
throws mid-chain, the cost MP has already been deducted and is NOT refunded.
This mirrors Phase 2 `chain` semantics where the state commits up to the point
of failure. The executor emits a `warning` event with code
`effect_execution_failed` and the `card_resolved` event still fires with
`outcome: "success"` (since cost was paid and the card was validly played —
the failure was in effect execution, not activation). See `phase3-report.md`
for the full rationale.

## Q2: 'custom' requirement type
`RequirementDefinition` supports `type: 'custom'` with arbitrary `params`.
The current executor always returns `true` for custom requirements. Phase 4+
will need to inject a custom checker function (similar to the `choose`
primitive's `resolver` from Phase 2). This is deferred and documented here.

## Q3: Multi-target cards ('all_opponents', 'all_mosjes', 'shared_field')
`resolveTargetReference` returns `undefined` for these target types. The
executor passes `undefined` for `resolvedTarget` and falls back to
`invocation.targetRef`. Cards using multi-target semantics cannot yet use
`$target` placeholders in effects — they would need a looping mechanic over
all valid targets. This is out of scope for Phase 3 (no real cards yet).
Needs a design decision before Phase 4 cards that target all opponents are
added.

## Q4: Inherited phase2-questions — unresolved items
From `phase2-questions.md`, the following remain unresolved entering Phase 4:

1. **U6 modifier sources** — still using generic flag keys. Phase 4 could
   formalize typed modifier schema.

2. **`searchDeckAndDraw` byType/byCost** — still warns and no-ops. A card
   catalog (CardId → CardDefinition lookup) would be needed. Phase 4 will
   register all cards in the registry; at that point `getCard()` can be
   used to inspect card types during search.

3. **`choose` primitive resolver** — still requires an injected resolver
   function. The player-input pipeline is deferred to Phase 5 or later.
