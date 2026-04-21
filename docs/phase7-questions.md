# Phase 7 Questions / Simplifications

1. `place_the_gym` requires a Fighting subtype check, but current condition primitives only support `checkCardTypeInPlay` by card type/id. Implemented with `cardType: "fighting"`, which may not match subtype semantics unless mosje flags encode it.
2. The user prompt used `turn_end`/`turn_start`/`quest_attempt`; runtime event names are currently `turn_ended`/`turn_started`/`quest_attempted`. Place manager maps these declarative trigger names to runtime event names.
