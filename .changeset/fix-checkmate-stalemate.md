---
'gungi.js': patch
---

Fix checkmate and stalemate detection to follow Gungi-specific rules

- **Checkmate**: Now correctly detects when a player is in check AND has no move that would escape check. In Gungi, players CAN move while in check (unlike chess), but checkmate occurs when no move escapes.

- **Stalemate**: Now correctly detects when a player is NOT in check but ALL possible moves would result in being in check. This is a draw condition.

- **Insufficient Material**: Added detection for draw when only two non-adjacent marshals remain on the board (no other pieces in play or in hand).

- **`isGameOver()`**: Updated to include stalemate and insufficient material as game-ending conditions alongside marshal capture, checkmate, and fourfold repetition.

- **`isDraw()`**: Now returns true for stalemate, fourfold repetition, or insufficient material.
