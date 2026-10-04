# Phase 50: Rarity-tier card redesign - Context

**Gathered:** 2026-10-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Card faces show rarity as one of four visual tiers (star count of `card.rarity`): tiers 1-3 boxed art with an escalating frame, tier 4 full art with holographic shine. Visual/rendering work only. Quest cards, game logic, drop weights (60/30/10/4), deck copy limits (4/3/2/1) and card backs are untouched.

</domain>

<decisions>
## Implementation Decisions

### Tier model
- **D-01:** ANY card type can be ANY tier (Mosje, Piecie, Place, Snelle at tier 1-4). Tier comes only from the star count; type only drives accent colour, pill, category label and cost badge. Places never have a cost badge. Renderer must support all 6 types x 4 tiers even though current card data does not cover every combination (no star-1 Mosjes - do not "fix").
- **D-02:** Visual truth is the Tiers 8 board (`docs/design/rarity-tiers/tiers-8-piecie-place-snelle.png`) plus `.planning/RARITY-TIERS-DESIGN.md`. If they disagree the board wins; ask before deviating.

### Mosje look
- **D-03:** The Tiers 7 (Alyssa/Mosje) board IS available as source: `docs/design/rarity-tiers/source/CardTiers7.dc.html` (board wins over handoff text per D-02). Build Mosjes against it, then show Gandalf the Mosje result for approval and fix from feedback.

### Build order and safety
- **D-04:** Work on branch `ui/rarity-tiers` (cut from `ui/card-frame-v1`, which holds the unfinished E1 frame). Everything via git branches; small commits; nothing to `main` without Gandalf's explicit OK.
- **D-05:** Implement tier 4 (full art) first, then boxed layout for tiers 1, 2, 3; stop for Gandalf's visual approval after each.

- **D-06 (Gandalf, 2026-10-04):** Footer text needs MORE bottom space than the handoff numbers: category label at bottom 30 (spec 22), MP/cost number at bottom 22 (spec 12), pill 54 (spec 46), traits line 85 (spec 77), ability text 122 (spec 114). Applies to ALL tiers and overrides handoff section 3.1 positions; already applied in styles/card-v1.css. Plans 50-02..50-05 must use these values, not the handoff's.

- **D-07 (Gandalf, 2026-10-04) REVERSED:** Real stars were tried and rejected; Gandalf prefers the 4 small square diamonds from the design (first N lit). Keep diamonds, no stars on the face.

### Claude's Discretion (Gandalf: "no preference" - Claude decides, defaults below)
- **Where tiers show:** big pop-up/detail card and hand cards get tier layouts. Field tile keeps current behaviour (not designed yet per handoff). Opponent/small renders drop side text and glints below a size threshold.
- **Rollout in game while building:** cards of tiers not yet implemented keep the current E1 look, so the game never looks half-broken. Use the existing `isCardV1Enabled` switch rather than a new mechanism.
- **Animation/performance:** foil and shine animate only on zoomed, hovered or field cards, pause off-screen, static in the hand strip; honour `prefers-reduced-motion`. Reuse `@property --holo-angle` in `styles/cards.css` if it merges cleanly.
- Frame is a uniform 18px on tier 4 (current E1 uses an 18/18/18/40 inset - plan must reconcile).
- Old `buildUnifiedCardHTML` still prints stars on the face; per brief stars move to the hover/detail panel only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design
- `.planning/RARITY-TIERS-DESIGN.md` - full tier spec (tokens, layers, effects, edge cases, verification checklist)
- `docs/design/rarity-tiers/tiers-8-piecie-place-snelle.png` - reference board, all four tiers
- `docs/design/rarity-tiers/Card system - Mosje, Piecie, Place, Snelle.pdf` - earlier card-system sheet
- `design/HANDOFF.md`, `design/card-frame-v1/` - E1 frame handoff, tokens and verification (already implemented on this branch)

### Code
- `src/ui/cardRenderer.js` (renderCard, buildUnifiedCardHTML), `src/ui/cardV1/*` (E1 renderer), `styles/card-v1.css`, `styles/cards.css`
- `src/data/boosterEngine.js`, `src/deck-builder.js` (RARITY_COPY_LIMITS), `src/ui/modalManager.js` (copyLimit) - rarity usage, do not change behaviour

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/cardV1/` - one-function-per-file E1 builders (spec builders per type, art layer, face, field face); extend with tier helpers.
- `getRarityTier` helper (new, per brief) goes in its own file per project one-function-per-file rule.

### Established Patterns
- Raw `.js`, no build step; CLAUDE.md: small files, one function per file.
- Tests: Playwright specs under `tests/ui/`, unit tests in `tests/`; 745-test suite must stay green.

### Integration Points
- `renderCard` -> `buildCardV1`; hand (`handRenderer.js`), detail modal, deck builder, opponent area all consume card faces.

</code_context>

<specifics>
## Specific Ideas

Like Pokemon/Yu-Gi-Oh rarity visuals (foiling) - higher star = flashier. Gandalf is not a coder; explain in plain language and keep changes safely on branches.

</specifics>

<deferred>
## Deferred Ideas

- Field-tile design for boxed cards, hover/long-press panel redesign, Quest cards - not designed; keep current.

</deferred>

---

*Phase: 50-rarity-tier-card-redesign*
*Context gathered: 2026-10-04*
