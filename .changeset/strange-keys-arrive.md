---
'gungi.js': minor
---

🆔 add stable piece ID tracking system

Implements deterministic piece IDs to enable reliable piece tracking
across moves without breaking the existing API.

**State-based preservation over FEN parsing**: Initially used FEN strings
to track previous state, but this caused ID corruption during moves.
Switched to storing full `ParsedFEN` state with IDs to maintain stability.

**Optional `id` field**: Added to `Piece` and `HandPiece` interfaces as
optional to maintain backward compatibility. No existing code breaks.

**Canonical assignment with move detection**: Uses position-based sorting
for deterministic base IDs, then preserves moving piece identity through
sophisticated move detection between game states.

- **ID format**: `{color}-{pieceType}-{number}` (e.g., `w-兵-2`, `b-帥-1`)
- **Move detection**: Analyzes board state changes to identify single moves
- **Preservation logic**: Maintains IDs for non-moving pieces by position,
  assigns preserved ID to moving piece at destination
- **Canonical fallback**: Complex state changes use position-based assignment

**Memory**: Stores additional `#previousState` but enables perfect stability
**Complexity**: Move detection adds logic but prevents ID drift entirely
**Performance**: Minimal impact due to efficient piece matching algorithms

The system provides deterministic, stable piece tracking while maintaining
full API compatibility and adding comprehensive test coverage.
