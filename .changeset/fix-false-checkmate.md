---
'gungi.js': patch
---

Fix false checkmate when the checked side can capture the checking side's marshal.

- `isCheckmate()` / `isStalemate()` now treat a move that captures the enemy marshal as an escape, since it ends the game.
