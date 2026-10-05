# Phase 51: Card refinement (hand, field, text behaviour) - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Refine how cards look and read at HAND size and as FIELD tiles, and make long/short text behave consistently across all card sizes. Builds on Phase 50 (branch ui/rarity-tiers, tier design approved). Visual only: no game logic, drop weights or copy limits.

</domain>

<decisions>
## Implementation Decisions

- **D-01 Scope (Gandalf):** Hand cards, field cards, and text-length consistency (he sees inconsistencies when texts get longer/shorter). Opponent area, graveyard, deck builder and detail views are NOT selected this round (later phase).
- **D-02 Aim:** Readability first (not tier-at-a-glance, not general look-and-feel), though anything clearly unfinished may be fixed.
- **D-03 Long text:** Shrink text to fit in steps, never below a readable minimum; the SAME rule on every card and size (extend getAbilityTextSize / shared rule rather than per-card hacks).
- **D-04 Field tiles must always show:** Name, MP number, short ability line. Tier marker on field tiles is NOT required.
- **D-05 Carry over from Phase 50:** no box behind MP; even 18px frame on full art; footer positions per Phase 50 D-06; only lit diamonds shown, no stars on face; wave texture kept very faint.

### Claude's Discretion
Exact minimum font sizes, breakpoints, and how the short ability line is derived (first sentence, or a short-text field if cards have one). Investigate where text behaviour is inconsistent today (hand vs field vs pop-up) and list it in the plan; ask Gandalf for any specific cards he noticed.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/phases/50-rarity-tier-card-redesign-4-tiers-boxed-full-art/50-CONTEXT.md` - tier decisions D-01..D-07
- `.planning/RARITY-TIERS-DESIGN.md`, `docs/design/rarity-tiers/` - design contract and boards
- `src/ui/cardV1/*` (esp. getAbilityTextSize, buildFieldFaceV1, formatAbilityLine), `styles/card-v1.css`, `styles/card-tiers*.css`, `src/ui/handRenderer.js`
- `tests/ui/card-tiers.spec.js` - existing 32 checks (Chromium + WebKit) to keep green

</canonical_refs>

<code_context>
## Existing Code Insights

- Field tiles use `buildFieldFaceV1` (old E1 look, `.card-v1--field`), untouched by Phase 50 by design.
- Hand cards render the tier layout shrunk; side text and glints drop below 120px (`card--tier-small`).
- Ability text size is length-based via `getAbilityTextSize`; field/hand sizes have min-font rules scattered in `styles/card-v1.css`.

</code_context>

<specifics>
## Specific Ideas

Gandalf noticed inconsistent behaviour when text gets longer/shorter; specific cards not yet named.

</specifics>

<deferred>
## Deferred Ideas

- Opponent area, graveyard, deck-builder previews and card detail pop-up refinement.
- Tier marker on field tiles.
- Merge of ui/card-frame-v1 + ui/rarity-tiers to main.

</deferred>

---

*Phase: 51 - Card refinement*
*Context gathered: 2026-10-05*
