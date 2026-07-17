# Phase 37: General Quest Attempt Affordability Gate - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Attempting a Quest charges a flat **20 MP attempt fee** from the acting Mosje
(a canonical rule — `docs/phase0-rulings.md:126`, dated 2026-07-12). Paying that
fee when the Mosje has < 20 MP drives it below 0 and, at Level 0, **defeats it**
(also per that same ruling). Today the human UI lets a player attempt a Quest
its Mosje cannot afford, self-destructing the Mosje. This phase closes that gap:
the player should not be able to *start* a Quest attempt with a Mosje that
can't afford the 20 MP fee — the attempt control is disabled/greyed instead.

**The 20 MP fee itself, and its lethality when unaffordable, are NOT changed** —
both are canonical and stay. This phase adds only the *pre-attempt affordability
gate* that the ruling explicitly permits ("every code path either clamps a
cost-paying ability from activating at all when unaffordable, or lets the
payment go through and applies the defeat rule" — we choose the clamp for Quest
attempts).

**In scope:** Both General Quests AND Personal Quests (they share the identical
20 MP `QUEST_COST` fee). The affordability rule is `mp >= 20` (a Mosje at exactly
20 MP may attempt — it pays down to exactly 0 and survives; only below-0 defeats).
**Out of scope:** Changing the 20 MP fee amount; changing quest rewards/penalties;
the bot path (`botDriver.js` already weighs cost via `QUEST_ATTEMPT_COST` and
never self-destructs); Mosje `abilityCost` (unrelated, deferred elsewhere).

</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** Gate **both** General Quests and Personal Quests. The identical
  ungated 20 MP `QUEST_COST` fee exists in both paths (`src/main.js:1511`
  general, `src/main.js:2582` personal); fixing only one leaves the same
  self-destruct bug half-closed. (User chose "Both quest types".)

### Gate presentation
- **D-02:** When a Mosje can't afford the 20 MP fee, **grey out / disable the
  attempt (activate) control** rather than showing a post-click "Cannot Attempt"
  dialog. User's words: "greyout/disable the activate/attempt buttons — easiest
  and visually easy to understand." This is a preventive disabled state on the
  trigger, consistent with how the multi-Mosje quest picker already disables
  unaffordable Mosjes (see D-04), not a block-after-click.

### Affordability threshold
- **D-03:** "Can afford" = **`mp >= 20`** (the existing `questCost = 20` constant
  in `showMosjeSelect`). A Mosje at exactly 20 MP is allowed (pays to exactly 0,
  survives per `phase0-rulings.md:126`); 19 or below is blocked (would go to -1 →
  defeat). This mirrors Phase 36's Welloe Force `mp >= amount` gate exactly.

### What already works (confirmed live in code this session — do NOT rebuild)
- **D-04:** The **multi-Mosje quest picker already gates correctly.** When 2+
  Mosjes exist, both the General Quest path (`src/main.js:1526`) and the
  Personal Quest path (`src/main.js:2701`) call `showMosjeSelect(..., questDef)`,
  and `showMosjeSelect` (`src/ui/modalManager.js:748-758`) already sets
  `disabled: mosjeSlot.disabled || (isQuestAttempt && mp < 20)` with a red MP
  label. This case is DONE — the phase must not regress it.
- **D-05:** **Personal Quests are already gated even single-Mosje**, because
  `showMosjeSelect` "always shows the modal regardless of Mosje count"
  (`src/ui/modalManager.js:734`) and the personal path always routes through it
  (`src/main.js:2701`). The phase must **verify + regression-test** this (per
  D-01's "both" scope), but likely needs no new gate code for the personal path.

### The actual gap to fix
- **D-06:** The real defect is the **General Quest single-Mosje path.** When the
  player has exactly one active Mosje, `src/main.js:1525-1528` skips the picker
  (`if (gqSlots.length > 1) showMosjeSelect else showQuestPreviewThenRoll(...)`)
  and calls `showQuestPreviewThenRoll` directly, which charges 20 MP
  (`src/main.js:1511`) with **no affordability check**. This is the exact path
  that defeated Michelle in the Phase 36 UAT (she was the only Mosje). The gate
  must cover this path — disable the General-Quest attempt trigger (or otherwise
  prevent the attempt) when the sole eligible Mosje has mp < 20.

### Claude's Discretion
- Exact wiring of the disabled state (extend `canAttemptGeneralQuest` /
  `getGeneralQuestBlockReason` in `src/abilities/questLogic.js:190` with an
  affordability reason vs. a UI-layer disable on the attempt button vs. always
  routing single-Mosje through `showMosjeSelect` too) — research/planning
  decides the cleanest mechanism. The `getGeneralQuestBlockReason` gate already
  has a "negative MP" reason and is the natural home for an affordability reason.
- Whether to unify the single-Mosje general path onto `showMosjeSelect` (which
  already disables correctly and always shows) — a tempting minimal fix — vs. a
  separate button-disable. Either satisfies D-02/D-06; planner picks.
- Exact copy for any disabled-state tooltip/label ("Needs 20 MP", etc.).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Governing rule
- `docs/phase0-rulings.md:126` — the "Defeat below 0 MP (2026-07-12, no
  exceptions)" ruling that (a) establishes the 20 MP Quest-attempt fee as
  canonical, (b) makes paying-below-0-at-Level-0 lethal, and (c) explicitly
  permits clamping a cost-paying action from activating when unaffordable — the
  license for this phase's gate.

### Direct reusable precedent
- `.planning/phases/36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede/36-CONTEXT.md`
  — Phase 36's D-05/D-06 (player-picks-payer + block-entirely-if-unaffordable)
  and its `showTributePayerSelect` picker are the exact affordability-gate
  pattern to mirror.
- `.planning/phases/36-.../36-UAT.md` — records the live repro (Michelle, 10 MP,
  single Mosje, attempted 20-MP Leap of Faith → knockout) that motivated this phase.

### Code touchpoints (verified live this session)
- `src/main.js:1245` (`canAttemptGeneralQuest` gate call), `:1420-1428`
  (general gqSlots build — no disabled flag), `:1507-1528`
  (`showQuestPreviewThenRoll` + the single-vs-multi branch — THE GAP), `:1511`
  (general 20 MP `QUEST_COST` charge), `:2582` (personal 20 MP `QUEST_COST`
  charge), `:2701` (personal picker via `showMosjeSelect`).
- `src/ui/modalManager.js:734-769` (`showMosjeSelect` — already disables mp<20
  for quest attempts, always shows).
- `src/abilities/questLogic.js:190` (`canAttemptGeneralQuest`) + `:141`
  (`getGeneralQuestBlockReason` — has the existing "negative MP" reason; natural
  home for an affordability reason).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `showMosjeSelect` (`src/ui/modalManager.js:737`): already implements exactly
  the desired disable-when-unaffordable behavior for quest attempts (`mp >= 20`,
  red label, disabled option). The cleanest fix may be to route the general
  single-Mosje case through it too (it always shows the modal regardless of count).
- `getGeneralQuestBlockReason` / `canAttemptGeneralQuest`
  (`src/abilities/questLogic.js:141,190`): the existing eligibility gate with a
  "negative MP" reason — an affordability reason slots in here for a pure-engine
  path the bot and tests can share.
- Phase 36's `showTributePayerSelect` + affordability idiom — same green/red
  `mp >= amount` disable convention.

### Established Patterns
- "Text/ruling wins; block-when-unaffordable" — Phase 36 just applied the
  identical clamp to Welloe Force. This phase extends the same clamp to Quest
  attempts.
- Card/quest tests live in `tests/ui/cards/` (real-engine, Playwright) and
  `tests/` (unit). A repro spec seeding a single Mosje under 20 MP attempting a
  General Quest is the natural regression guard (make-it-fail-first per CLAUDE.md).

### Integration Points
- The gate must NOT regress the already-correct multi-Mosje picker (D-04) or the
  already-gated Personal Quest picker (D-05).
- The bot path (`botDriver.js`) is unaffected — it already accounts for the fee
  and never self-destructs.

</code_context>

<specifics>
## Specific Ideas

- User's framing: disable/grey the attempt-or-activate button when unaffordable —
  "easiest and visually easy to understand." Prefer a visible disabled control
  over a post-click error dialog.
- Per CLAUDE.md, this bug MUST be reproduced in a live browser (Playwright,
  single Mosje < 20 MP attempting a General Quest) and made to fail first, before
  the fix — the Phase 36 UAT already demonstrated the repro manually (Michelle).

</specifics>

<deferred>
## Deferred Ideas

- Reconsidering whether Quests should cost 20 MP at all, or whether the fee
  should scale — out of scope; the fee is canonical (`phase0-rulings.md:126`).
- Mosje `abilityCost` enforcement — separate long-standing unenforced-cost issue,
  already deferred from Phase 36 (D-04 there).

None else — discussion stayed within phase scope.

</deferred>

---

*Phase: 37-general-quest-attempt-affordability-gate*
*Context gathered: 2026-07-16*
