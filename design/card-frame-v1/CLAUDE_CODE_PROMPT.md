# Claude Code kickoff prompt: MOSJES card frame v1

Paste everything below into Claude Code, in the repo root, after unzipping `card-frame-v1/` into `design/card-frame-v1/`.

---

You are implementing the approved new card design ("card frame v1") into the MOSJES game, for every card type. Work like a careful senior front-end dev who has to hand this back with zero surprises. Use the GSD (get-shit-done) workflow if it is installed in this repo: plan the phases, execute one phase at a time with atomic tasks, verify each phase before the next. If GSD is not installed, follow the same discipline by hand.

## 1. Read first (before touching anything)
1. `CLAUDE.md` and `MOSJES_Phase0_Rulings.md` - follow them.
2. `design/card-frame-v1/HANDOFF.md` - the full brief, spec, data mapping and verification checklist. It is the contract.
3. `design/card-frame-v1/reference/card-system.html` (open it) and `design-tokens.json`. If `card-system.png` is there, it is the visual truth.

## 2. Fetch and save the design
- The design package should already be in `design/card-frame-v1/`. If the folder is missing or incomplete, STOP and tell me. (The original lives in a private claude.ai artifact I made, which you cannot open: https://claude.ai/artifact/MpeFz61Zf4Cfrvc21MsT2T. Do not try to scrape it.)
- Create branch `ui/card-frame-v1` from an up-to-date main. Commit the design folder as its own first commit ("docs: add card frame v1 design handoff"). Nothing goes to main.

## 3. Before building: investigate and plan (no code yet)
- Find the current renderers for Mosje, Piecie, Snelle and Place cards (`renderMosjeCard()` in `script.js` and its siblings) and the pop-up and field-mode paths.
- There is an unfinished card redesign on another branch (patched `mosje_style.css`: full-art background, type-colored borders, trait rows, activate-ability button). Inspect it and say what you will reuse and what conflicts. Do not duplicate its work.
- Check the data model against HANDOFF section 3: where do level, current MP, cost, requirement, Piecie sub-category, traits, Place good-for/bad-for and art live? List what is missing.
- Output a short plan: phases, files you will touch, risks, open questions. **Stop and wait for my OK.**

## 4. Build, one card type at a time
Order: Mosje, then Piecie, then Snelle, then Place, then the shared hover panel if not done earlier. For each type:
1. Implement pop-up and field mode to the spec. Patch existing CSS under a `.card-v1` namespace; do not replace files wholesale; leave unrelated files alone.
2. Run the full vitest suite (must stay green) and add tests for the data-to-face mapping you introduced (name/nickname parsing, badge value, pill, info line, per type).
3. Run the HANDOFF section 8 verification for that type with the listed test cards, rendered from real game data. Write results to `design/card-frame-v1/VERIFICATION.md` (pass/fail per line, plus every visible difference from the reference).
4. Commit (one commit per type). **Stop and show me**: what changed, the verification result, and how to see it (screenshots, or exact steps with Live Server). Wait for my approval before the next type.

## 5. Hard rules
- Visual layer only. Do not change card text, stats, costs, abilities or game logic. No emoji.
- Do not touch Quest cards or face-down card backs.
- Keep every existing interaction working (activate-ability button, selection, targeting, face-down).
- Reuse existing UI components; no new modals.
- Never claim something "matches the design" without having rendered it and compared it to the reference. If you cannot render here, say so and tell me exactly how to check.
- If text overflows or something in the spec does not work with real data, do not silently improvise or clip: list it and ask.
- Out of scope, but flag if you hit them: the "Lucky Coin wrong label" bug, MP floor below 0.
- No direct commits to main. Merge only when I say so, after the whole suite is green.

## 6. When you finish a phase, report in this shape
Done: / Verified (with evidence): / Differences from design: / Open questions: / Next.
