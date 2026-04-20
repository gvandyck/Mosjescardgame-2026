# Phase 2 Questions

1. U6 modifier data sources are not modeled explicitly in Phase 1 state.
- Current primitives read modifier hints from generic flags on Mosjes/Players/Place.
- Proposed for Phase 3+: formalize typed modifier sources instead of generic flag keys.

2. search-deck-and-draw filter shape references byType/byCost, but Phase 1 state has only CardId values and no card catalog in memory.
- Current primitive supports byName directly and emits warning for byType/byCost requests.

3. check-trait/check-card-type-in-play require trait/type metadata absent from runtime state.
- Current condition primitives read from Mosje flags (traits/cardType) and document this dependency.

4. check-mp override behavior requires context of quest-vs-non-quest checks but primitive params did not define this discriminator.
- Current primitive accepts `forQuestCheck` boolean to apply `quest_mp_override` only when true.

5. discard-cards mode='choose' requires player input resolver not available in pure primitive signature.
- Current implementation expects explicit `chosenCardIds` in params for tests; otherwise emits warning no-op.
