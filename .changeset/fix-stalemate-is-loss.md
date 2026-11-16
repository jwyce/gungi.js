---
'gungi.js': patch
---

Score stalemate as a loss for the side to move instead of a draw.

- `isDraw()` no longer returns true for stalemate; it now covers only fourfold repetition and insufficient material.
- A move that delivers stalemate is suffixed with `#` instead of `=`.
- `isStalemate()` and `isGameOver()` are unchanged. Callers that scored stalemate as a draw should score it as a loss for `turn()`.
