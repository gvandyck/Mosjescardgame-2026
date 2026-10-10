---
phase: 53
slug: 2-0-card-data-and-example-decks
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-10
---

# Phase 53 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> `wave_0_complete` / `nyquist_compliant` mean the PLANS cover every row with an automated command. Status stays `draft` until execution turns the rows green.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^2.1.4 (node environment) |
| **Config file** | `vitest.config.ts` (`include: ["tests/**/*.ts"]`, excludes `_archive`) |
| **Quick run command** | `npx vitest run tests/data tests/ui/card-v1-mosje.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** quick run command + `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js src/ui/cardV1/parseMosjeName.js`
- **After every plan wave:** `npm test`. The one planned exception is wave 2 (53-02): it may leave only the V4 old-Mosje-text failures it lists, and wave 3 (53-03) must end fully green.
- **Before `/gsd:verify-work`:** full suite green + seeded bot-vs-bot smoke on the Example Decks + `npm run test:sim` (0 crashes)
- **Max feedback latency:** 15 seconds (Vitest); the sim runs once, at the phase gate

---

## Per-Task Verification Map

| Requirement | Behavior | Plan / Task | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-------------|-----------|-------------------|-------------|--------|
| DATA-01 (infra) | Parser gives 183 rows; 183-entry id map; ids exist | 53-01 T1–T2 | unit | `npx vitest run tests/data/card-list-parser.test.ts tests/data/obby2-data-helpers.test.ts` | ❌ created in 53-01 | ⬜ pending |
| DATA-01/02 | 32 Mosjes: name/cost/rarity/startMP/levels/ability/synergy/limitPerDeck/foil | 53-02 T2 | unit (E29 Mosjes) | `npx vitest run tests/data/card-list-2-0-mosjes.test.ts` | ❌ created in 53-02 | ⬜ pending |
| guard | Generator idempotent, CRLF-safe; editor round-trip | 53-02 T1–T2 | unit | `npx vitest run tests/data/obby2-patch-card.test.ts tests/card-editor-patch.test.ts` | ❌ / ✅ | ⬜ pending |
| DATA-01/02 | Comma name form; V4 Mosje-text tests rewritten | 53-03 T1–T2 | unit | `npx vitest run tests/ui/card-v1-mosje.test.ts && npm test` | ✅ rewrite | ⬜ pending |
| DATA-03 | Tags 7/5/9/6, max one | 53-04 T1 | unit (E28) | `npx vitest run tests/data/card-tags-2-0.test.ts` | ❌ created in 53-04 | ⬜ pending |
| DATA-01/03 | Piecies/Snelle: name/text/cost/rarity, stays, levelGate, limitPerDeck, givesMP | 53-04 T1–T2 | unit (E29 Piecies+Snelle) | `npx vitest run tests/data/card-list-2-0-piecies-snelle.test.ts` | ❌ created in 53-04 | ⬜ pending |
| DATA-01/04 | Quests: text, stack 13/13/12, band, rollTrait, costText/costId, win/lose == band, extras; 2 new Quests | 53-05 T1 | unit (E29 Quests) | `npx vitest run tests/data/card-list-2-0-quests.test.ts tests/data/deck-balance.test.ts` | ❌ created in 53-05 | ⬜ pending |
| DATA-01/05 | Places: cost/rarity/text/goodFor/badFor/limitPerDeck | 53-05 T2 | unit (E29 Places) | `npx vitest run tests/data/card-list-2-0-places.test.ts` | ❌ created in 53-05 | ⬜ pending |
| DATA-05 | Drain Zone + The Void player-facing; accessor filters `disabled` | 53-05 T2 | unit | `npx vitest run tests/data/player-facing-places.test.ts` | ✅ rewrite | ⬜ pending |
| DATA-01/06 | Visible cards == Card List (bijection); 15 hidden cards kept + excluded from boosters/starter-eligible/Places/deck-builder | 53-06 T1–T2 | unit (E29 umbrella) | `npx vitest run tests/data/card-list-2-0.test.ts tests/data/hidden-cards.test.ts` | ❌ / ✅ rewrite | ⬜ pending |
| DATA-07 | 3 Example Decks: 30 cards, ≤2 copies, ★★★★★ ≤1, start Mosje inside, doc agreement | 53-07 T1 | unit (E30) | `npx vitest run tests/data/example-decks-2-0.test.ts` | ❌ created in 53-07 | ⬜ pending |
| DATA-06 | Only the 3 Example Decks are player-facing (lobby/onboarding/bot); old decks disabled, data kept | 53-07 T2 | unit | `npx vitest run tests/data/player-facing-decks.test.ts tests/data/duo-deck-validity.test.ts tests/bot/pick-bot-deck.test.ts` | ✅ rewrite | ⬜ pending |
| guard | V4 engine runs seeded bot games on the Example Decks | 53-07 T2 | unit smoke | `npx vitest run tests/bot/offlineGame.smoke.test.ts` | ✅ extend | ⬜ pending |
| gate | Deck UI specs + simulation | 53-07 T3 | e2e + sim | `npx playwright test tests/ui/onboarding-starter-deck.spec.js tests/ui/active-deck-lobby.spec.js && npm run test:sim` | ✅ update | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Covered inside the plans. Each test file is written red first, inside the plan that makes it green:
- [x] `scripts/obby2/` shared Card List / Example Decks parsers + id map (53-01; plain `.mjs`, not under `tests/`)
- [x] E29 split across `tests/data/card-list-2-0-mosjes.test.ts` (53-02), `card-list-2-0-piecies-snelle.test.ts` (53-04), `card-list-2-0-quests.test.ts` + `card-list-2-0-places.test.ts` (53-05), `card-list-2-0.test.ts` umbrella (53-06)
- [x] E28 `tests/data/card-tags-2-0.test.ts` (53-04); E30 `tests/data/example-decks-2-0.test.ts` (53-07)

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s (sim excluded; phase gate only)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (execution)
