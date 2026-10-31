# Final Card Designs (Obby Card Game 2.0)

Handover sheet for how every card must look in the game, locked 29–31 Oct 2026.

- **Canvas (visual reference):** "Obby Card Game 2.0 · Final Card Designs", https://claude.ai/artifact/GAaZFfx4dKMh36PQt6LTX5 (private, owner: Gandalf). Boards 01–09: overview & legend, anatomy, Mosjes / Ultimate / Personal Quest, Piecie · Snelle · Place · Quest, rarity, edge cases, board tiles, board states, hand & detail panel.
- **Written spec:** `docs/obby-2.0/Obby Card Game 2.0 - Card Design Spec.md` (every value), decisions in `... - Card Design Lock.md`, card back in `... - Card Back.md`, rules in `... - Rules and Decisions.md`.
- **`boards/`:** the canvas boards as generated HTML (`*.dc.html` + `canvas.json`). Art is referenced as `/_blob/<id>` from the canvas, so these render with art only inside the canvas.
- **`card-back.svg`:** the chosen card back ("XXL · Engraved" layout with solid marks at 8 %), 440 × 616.
- **`generator/`:** the Python scripts that render the boards (`python3 final.py` writes `../final/project/*.dc.html`). `gen.py` = card renderer, `gen_board.py` = board tiles, `final.py` = the boards, `data.json` = dump of `src/data` (obby-2.0, 29 Oct). `qa/` = local preview (`prevf.py`, swaps blobs for `assets/*-art`) and Playwright checks (`shotf.js`, text overflow / overlap). Design reference only; the game itself is built from the spec, not from these scripts.
