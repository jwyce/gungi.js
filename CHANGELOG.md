# gungi.js

## 3.1.0

### Minor Changes

- e2726a2: Implements unique piece identifiers using `type-color-number` format
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
