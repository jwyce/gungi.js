---
'gungi.js': patch
---

Fix fourfold repetition comparing only the board.

- `isFourfoldRepetition()` now compares the full position: the board, both hands and the side to move (the first three FEN fields). The same board with the other side to move, or with different hands, no longer counts as a repeat, so games are no longer drawn too early.
