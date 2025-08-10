---
'gungi.js': minor
---

Implements unique piece identifiers using `type-color-number` format
that persist across all moves, captures, and state changes.

**Parallel ID Registry**: Chose to maintain existing FEN-based
architecture while adding separate `PieceIdRegistry` class. This
preserves backward compatibility while enabling advanced ID features.

**Snapshot/Restore Pattern**: Since moves regenerate state from FEN
(losing IDs), implemented snapshot-before/restore-after pattern in
`move()` method. Captures ID mappings before FEN reinitialization,
then intelligently restores them accounting for piece movements.

**Individual Hand Tracking**: Extended `HandPiece` with `ids?: string[]`
to track individual pieces within aggregate counts. Enables specific
piece selection for arata moves while maintaining existing count-based API.

**Auto-Assignment**: IDs assigned automatically on game initialization.
All existing code works unchanged, IDs are purely additive enhancement.

- `getPieceId()`, `getPieceById()` - board piece lookup
- `getHandPieceIds()`, `getHandWithIds()` - hand piece access
- `getBoardWithIds()` - complete board state with IDs
- `getHandPieceId()` - specific hand piece selection

Addresses the fundamental challenge of maintaining piece identity
across the library's FEN-based state management system.
