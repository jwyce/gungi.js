# gungi.js

## 3.4.1

### Patch Changes

- 1373374: loadPgn previously failed when parsing a pgn with comments

## 3.4.0

### Minor Changes

- 5d72347: add pgn comments

## 3.3.1

### Patch Changes

- ce21aae: fix fen null check, swap to falsy

## 3.3.0

### Minor Changes

- da96bcf: adds inCheck, checkmate, and stalemate detection

## 3.2.3

### Patch Changes

- aa2e600: 🆔 improved piece id tracking

## 3.2.2

### Patch Changes

- 3f91fdc: 🎯 optimize ID reassignment to minimize swaps

  Improves duplicate ID resolution by finding the closest available
  ID number instead of sequential assignment. This reduces unnecessary
  ID changes when pieces of the same type/color have duplicates.

  Key improvements:

  - Bidirectional search (±50 range) from original ID number
  - Stability-first sorting prioritizes board pieces over hand pieces
  - `ensureUniqueIdsLenient()` preserves existing IDs when possible

  Trade-offs:

  - Slightly more complex logic vs. simple sequential assignment
  - O(50) search per duplicate vs. O(1) sequential, but bounded
  - Better UX stability vs. marginal performance cost

## 3.2.1

### Patch Changes

- f8f09bd: 🔧 prevent duplicate piece IDs in state transitions

  Addresses race conditions in rapid `load()` calls where same piece
  type/color could receive identical IDs, breaking game state integrity.

  - `applyCanonicalToMissingIds` used flawed conflict detection
  - Arata moves assigned same ID to both board and hand pieces
  - Race conditions during rapid state transitions

  Fixed core ID assignment logic with `Set`-based conflict tracking
  rather than real-time array scanning. Balanced two requirements:

  **Stability**: Preserve IDs across close FEN states (critical for UX)
  **Uniqueness**: Ensure no duplicate IDs ever persist in system

  - `ensureUniqueIdsLenient()`: Minimal fixes, preserves stability
  - `ensureUniqueIds()`: Complete reassignment for canonical states
  - `checkForDuplicateIds()`: Detection without modification

  Arata moves now maintain hand piece ID stability while giving
  board pieces new IDs, eliminating the duplicate scenario without
  breaking expected behavior.

## 3.2.0

### Minor Changes

- 9e50c6e: 🆔 add stable piece ID tracking system

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

## 3.0.8

### Patch Changes

- 7c59cf7: technically a breaking change but fixes typo of constant BEGINNNER_POSTION to be BEGINNER_POSITION

## 3.0.7

### Patch Changes

- 4c8fe60: Marshals should not be able to stack in intro and beginner game modes

## 3.0.6

### Patch Changes

- 771f68b: load pgn was not filtering out empty moves when parsing pgn

## 3.0.5

### Patch Changes

- 818c674: prevent history for resetting when calling load(fen)

## 3.0.4

### Patch Changes

- c31dadc: when both players finished draft, arata range should be as far as your deepest piece into enemy territory. previously we were missing squares when checking if a piece of the same color is in the rank

## 3.0.3

### Patch Changes

- 177302d: fix square list order but actually this time

## 3.0.2

### Patch Changes

- 97d54b3: fix square list order

## 3.0.1

### Patch Changes

- dd87fbb: nothing's actually changing just bumping version

## 3.0.0

### Major Changes

- 4f5ced4: Overhaul everything, new logic, implement new offical rules
