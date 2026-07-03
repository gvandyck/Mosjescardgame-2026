# Phase 34: Account Starter-Deck Onboarding & Active Deck - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Source:** Interactive discovery (3 rounds of AskUserQuestion) — discuss-phase equivalent complete

<domain>
## Phase Boundary

Turn the 5 new synergy "duo" starter decks (added in commit `aafa0a9`) into the backbone
of account onboarding and deck ownership.

**In scope:**
- On first login, a signed-in player with **0 saved decks** is shown a **blocking**
  "choose your starter deck" modal offering **only the 5 duo decks**.
- Picking a deck: saves it to `users/{uid}/decks/{id}`, sets it as the player's **active
  deck** (`users/{uid}/profile/activeDeckId`), and grants the deck's **exact card multiset**
  to the collection so it is fully rebuildable in the deck builder.
- Lobby (signed in): hide the old `#deck-select` dropdown; show an **active-deck panel**
  (deck name + its Mosjes) plus a **"Change deck"** button that opens a selection modal
  listing the player's saved decks and persists the new active choice.
- Lobby (guest / not signed in): keep a dropdown, but it now lists **only the 5 duo decks**;
  guests can still start a game vs bot with no account.
- Bot / AI opponent: picks a **true-random** deck from the 5 duo decks (mirroring the
  player's deck is allowed).
- Remove the stale `DIGITAL_CONTROL_STARTER_CARDS` auto-seed in `accountSetup.js` — new
  accounts receive NO cards until they pick a starter deck.

**Out of scope (explicitly deferred):**
- Munten shop for buying additional starter decks.
- Claiming more than one starter deck (one-time, pick exactly one).
- Deck import/export.
- Any change to the 3 original decks' DATA (they stay in `STARTER_DECKS` untouched as
  bot/test fixtures — just never shown to players).
</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Onboarding trigger & flow
- Trigger: signed-in user with **0 saved decks** entering the lobby. Modal is **blocking**
  (lobby locked until they pick). Guarantees every signed-in player has a deck + cards
  before their first game.
- One-time: choose exactly ONE of the 5 duo decks. More decks come only from the deck
  builder + booster packs. No re-pick, no shop.

### Which decks are offered
- **Only the 5 duo decks:** `DUO_COERT_BINTI`, `DUO_GANDOE_MICHELLE`, `DUO_CHRIS_YOURI`,
  `DUO_JISCA_ALYSSA`, `DUO_WEST_CLESS`.
- The 3 originals (`PHYSICAL_FORCE`, `DIGITAL_CONTROL`, `ARTISTIC_RHYTHM`) REMAIN in
  `src/data/starterDecks.js` unchanged — needed as bot/test fixtures — but are filtered out
  of every player-facing list. Introduce a single source of truth for "player-facing decks"
  (e.g. an `isDuoDeck`/`playerFacing` flag or an exported `PLAYER_STARTER_DECKS` filter) so
  the onboarding modal, guest dropdown, and bot pool all agree.

### What a pick grants
- `saveDeck(uid, deckDef)` — deck stored as-is under `users/{uid}/decks/{id}`.
- `setActiveDeckId(uid, deckId)` — new profile field `users/{uid}/profile/activeDeckId`.
- `addCardsToCollection(uid, cardIds)` with the deck's **EXACT multiset** (e.g. 3× Kannetje
  Melk if the deck runs 3). NOT `seedCollection` (which only grants 1 of each unique). The
  player must be able to fully rebuild their starter deck in the builder.
- New helper (one exported function per file, per CLAUDE.md): expand a `STARTER_DECKS` entry
  into a flat `cardIds[]` multiset (mosjes + piecies + snellePiecies + places + quests), then
  perform save + setActive + grant. Lives in `src/multiplayer/` (e.g.
  `seedStarterDeck.js` / `claimStarterDeck.js`).

### Active deck concept (NEW)
- Persisted at `users/{uid}/profile/activeDeckId`.
- Add `getActiveDeckId(uid)` and `setActiveDeckId(uid, deckId)` to `userStore.js`.
- On lobby load for a signed-in user: read decks + activeDeckId; if activeDeckId missing but
  decks exist, default to the first deck.

### Lobby UI (signed in vs guest)
- Signed in: hide `#deck-select`; render an **active-deck panel** (name + Mosjes) and a
  **"Change deck"** button. Button opens a selection modal listing the player's saved decks;
  selecting one calls `setActiveDeckId` and updates the panel.
- Guest: `#deck-select` stays, populated with the 5 duo decks only.
- The starting game must read the active deck (signed in) or the dropdown value (guest).

### Modal reuse (CLAUDE.md golden rule)
- Both the onboarding picker AND the deck-switcher must be built on the existing
  `initModalManager` / modal system (generic selection modal), NOT bespoke one-off modals.
  Same generic component, different title/options/callback.

### Bot deck
- `pickOpponentDeck` / bot deck selection draws a **true-random** deck from the 5 duo decks
  (mirror allowed). Currently `main.js` filters STARTER_DECKS to `!== deckId`; change the
  pool to the 5 duo decks and allow mirrors.

### Claude's Discretion
- Exact filenames for new helpers/modules (follow one-function-per-file, <80 line files).
- Exact DOM/CSS for the active-deck panel (match existing lobby styling).
- Whether "player-facing" is a data flag vs a derived filter — pick the cleanest.
- Guest dropdown wiring reuse of the existing `main.js:98-141` populate logic.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Starter deck data & lobby
- `src/data/starterDecks.js` — the 8 decks (3 original + 5 duo). Duo IDs listed above.
- `src/main.js` (~lines 90–210, 390–400, 900–930, ~3023) — lobby deck-select populate,
  human/bot deckId defaults, `pickOpponentDeck`, offline game start.
- `index.html` (~line 30) — `#deck-select` "Starter Deck" dropdown markup.

### Account / storage
- `src/multiplayer/accountSetup.js` — `initNewAccount()`; REMOVE the stale
  `DIGITAL_CONTROL_STARTER_CARDS` auto-seed (IDs are stale, e.g. `mosje_martin_historian`).
- `src/multiplayer/userStore.js` — `saveDeck`, `loadUserDecks`, `deleteDeck`, profile
  read/write. ADD `getActiveDeckId` / `setActiveDeckId`.
- `src/multiplayer/collectionStore.js` — `addCardsToCollection` (exact counts, use this),
  `seedCollection` (1-of-each, do NOT use for starter grant).
- `src/multiplayer/authManager.js` — `onAuthStateChanged`, `getCurrentUser`.
- `src/deck-builder.js` — existing deck-select/save/load patterns to mirror; already reads
  collection to gate rebuildability.

### UI / modal
- `src/ui/modalManager.js` — `initModalManager`; generic modal/preview API to build both
  the onboarding picker and the deck switcher on.

### Rules / conventions
- `CLAUDE.md` — one-function-per-file, files <80 lines, reusable SelectionModal, reproduce
  bugs in a live browser (Playwright), full verification sequence before commit
  (`node --check` on UI files → `npm test` → sim if MP logic touched — MP is NOT touched here).
</canonical_refs>

<specifics>
## Specific Ideas

- Introduce a single "player-facing starter decks" accessor so onboarding modal, guest
  dropdown, and bot pool never drift out of sync.
- Grant helper must expand duplicates (the duo decks run 2–3× of some Piecies).
- Default activeDeckId to first saved deck if the profile field is missing (migration-safe
  for any accounts created before this phase).

## Tests required (per CLAUDE.md "every feature gets a test")
1. **Duo-deck validity** — every card ID in all 5 duo decks resolves against
   MOSJES/PIECIES/SNELLE_PIECIES/PLACES/QUESTS (closes the gap flagged pre-phase; unit test).
2. **Exact-count seeding** — claiming a starter deck grants the exact multiset (3× where the
   deck runs 3), and saves the deck + sets activeDeckId.
3. **Active-deck persistence** — `setActiveDeckId` then `getActiveDeckId` round-trips; lobby
   defaults to first deck when activeDeckId absent.
4. **Guest dropdown** — the player-facing list contains only the 5 duo decks (no originals).
5. **Bot pool** — bot deck selection only ever returns one of the 5 duo decks.
6. Prefer a Playwright UI spec (`tests/ui/`) for the blocking onboarding modal + switcher
   where feasible, using existing test hooks / offline session; unit tests for pure helpers.
</specifics>

<deferred>
## Deferred Ideas

- Munten shop to buy additional starter decks.
- Claiming/owning more than one starter deck for free.
- Deck import/export.
- Perspective/board reworks and other unrelated backlog items.
</deferred>

---

*Phase: 34-account-starter-deck-onboarding*
*Context gathered: 2026-07-03 via interactive discovery (discuss-phase equivalent)*
