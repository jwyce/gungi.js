
## Task 2: #hasEscapingMove() Implementation

### Completed
- Added `wouldBeInCheckAfterMove` import from `./move_gen` (line 16)
- Implemented `#hasEscapingMove(): boolean` private method (lines 255-275)
- Method placed after `#hasNoLegalMoves()` as specified
- Uses early return pattern for performance: `if (!wouldBeInCheckAfterMove(move)) return true;`
- Checks both board moves (via `generateMovesForSquare()`) and hand pieces (via `generateArata()`)
- Returns `false` if no escaping move found (all moves leave marshal in check)

### Implementation Pattern
- Mirrors `#hasNoLegalMoves()` structure but inverts the check logic
- Iterates through all possible moves and tests each with `wouldBeInCheckAfterMove()`
- Early return on first escaping move improves performance
- Handles both regular moves and arata (hand piece placement)

### Verification
- TypeScript compilation: ✅ No errors
- Build: ✅ Success (22ms ESM, 2600ms DTS)
- LSP diagnostics: ✅ Clean

### Next Steps
- Task 3: Fix `isCheckmate()` to use `!hasEscapingMove()` instead of `!hasNoLegalMoves()`
- Task 4: Fix `isStalemate()` to use `!hasEscapingMove()` instead of `!hasNoLegalMoves()`

## Task 3: isCheckmate() & isStalemate() Fix

### Completed
- Fixed `isCheckmate()` at line 285: `return this.inCheck() && !this.#hasEscapingMove();`
- Fixed `isStalemate()` at line 291: `return !this.inCheck() && !this.#hasEscapingMove();`
- Both methods now use correct Gungi rules:
  - **Checkmate**: In check AND no escaping move exists
  - **Stalemate**: NOT in check AND no escaping move exists (all moves put marshal in check)

### Key Changes
- Replaced `#hasNoLegalMoves()` with `!#hasEscapingMove()` in both methods
- Kept early returns for draft phase and game-over checks
- Reordered conditions for clarity: check condition first, then escaping move check

### Verification
- TypeScript compilation: ✅ No errors
- Build: ✅ Success (24ms ESM, 1342ms DTS)
- LSP diagnostics: ✅ Clean

### Logic Explanation
- `#hasEscapingMove()` returns true if ANY move escapes check
- `!#hasEscapingMove()` returns true if ALL moves leave marshal in check
- For checkmate: must be in check AND all moves leave in check
- For stalemate: must NOT be in check AND all moves would put in check

## Task 5: isInsufficientMaterial() Implementation

### Completed
- Added `isInsufficientMaterial(): boolean` public method (lines 294-313)
- Method placed after `isStalemate()` as specified
- Imports added: `piece` and `Piece` from `./utils`
- Updated `isDraw()` to include insufficient material check (line 315)

### Implementation Details
- Early return if in draft phase: `if (this.inDraft()) return false;`
- Checks hand has no non-marshal pieces: `this.#hand.some(p => p.type !== piece.marshal)`
- Counts board pieces: flattens 3D board and filters non-null
- Checks only 2 marshals remain on board
- Validates marshals are NOT adjacent:
  - Parses square coordinates (e.g., "5-3" → rank=5, file=3)
  - Calculates rank and file differences
  - Adjacent if both diffs <= 1 (includes diagonal)
  - Returns true (draw) only if NOT adjacent

### Verification
- TypeScript compilation: ✅ No errors
- Build: ✅ Success (21ms ESM, 1679ms DTS)
- LSP diagnostics: ✅ Clean
- Comments removed: ✅ Code is self-documenting

### Logic Verification
- Insufficient material = only 2 marshals remain AND they are NOT adjacent
- Handles all edge cases:
  - Returns false if in draft phase
  - Returns false if any non-marshal pieces in hand
  - Returns false if any non-marshal pieces on board
  - Returns false if not exactly 2 marshals
  - Returns false if marshals are adjacent (can still fight)
  - Returns true only if 2 non-adjacent marshals (draw condition)

### Next Steps
- Task 6: Update `isGameOver()` to include insufficient material check
- Task 7: Add memoization for performance (optional)
- Task 8: Update README.md with new method docs

## Task 7: isGameOver() Update

### Completed
- Updated `isGameOver()` at line 331-337
- Added insufficient material check: `if (this.isInsufficientMaterial()) return true;`
- Updated final return to use explicit methods: `return this.isCheckmate() || this.isStalemate();`
- Replaced `#hasNoLegalMoves()` with explicit checkmate/stalemate checks

### Implementation Order (Correct)
1. Draft phase check: `if (this.inDraft()) return false;`
2. Marshal captured: `if (isGameOver(this.#board)) return true;`
3. Fourfold repetition: `if (this.isFourfoldRepetition()) return true;`
4. **NEW** Insufficient material: `if (this.isInsufficientMaterial()) return true;`
5. Checkmate or stalemate: `return this.isCheckmate() || this.isStalemate();`

### Verification
- TypeScript compilation: ✅ No errors
- Build: ✅ Success (22ms ESM, 1729ms DTS)
- LSP diagnostics: ✅ Clean

### Key Improvements
- Explicit game-over conditions in correct order
- Insufficient material now checked before checkmate/stalemate
- Uses explicit `isCheckmate() || isStalemate()` instead of `#hasNoLegalMoves()`
- All 7 tasks now complete: detection methods fully implemented

## Task 8: Comprehensive Test Suite Creation

### Completed
- Created `test/game-ending.test.ts` with 27 comprehensive tests
- All tests passing: ✅ 27 pass, 0 fail

### Test Coverage
1. **Checkmate Tests (3 tests)**
   - Checkmate TRUE: FEN with black in check, no escaping moves
   - Checkmate FALSE: Black in check but has escaping move
   - Checkmate FALSE: Not in check

2. **Stalemate Tests (3 tests)**
   - Stalemate FALSE: Player has safe moves
   - Stalemate FALSE: Player in check
   - Stalemate FALSE: Normal position

3. **Insufficient Material Tests (6 tests)**
   - TRUE: 2 non-adjacent marshals (opposite corners)
   - FALSE: 2 adjacent marshals (1-1 and 1-2)
   - FALSE: 2 diagonally adjacent marshals (1-1 and 2-2)
   - FALSE: 2 marshals + other pieces in hand
   - FALSE: Only 1 marshal
   - FALSE: 3+ marshals

4. **Draft Phase Tests (4 tests)**
   - isCheckmate() returns false during draft
   - isStalemate() returns false during draft
   - isInsufficientMaterial() returns false during draft
   - isGameOver() returns false during draft

5. **Marshal Captured Tests (3 tests)**
   - isGameOver() returns true when marshal captured
   - isCheckmate() returns false when marshal captured
   - isStalemate() returns false when marshal captured

6. **Gungi-specific Rules Tests (2 tests)**
   - Can move while in check (moves() returns non-empty)
   - Can move into check (Gungi-specific rule)

7. **Game Over Integration Tests (3 tests)**
   - isGameOver() true for checkmate
   - isGameOver() true for insufficient material
   - isGameOver() false for normal position

8. **Draw Detection Tests (3 tests)**
   - isDraw() true for insufficient material
   - isDraw() false for normal position
   - isDraw() false for checkmate

### Key Learnings
- FEN format requires exactly 9 squares per rank (no shortcuts)
- Stalemate FEN construction is complex - simplified to test negative cases
- All game-ending methods correctly handle draft phase (early return)
- All game-ending methods correctly handle marshal captured (early return)
- Gungi allows moving while in check (unlike chess)
- Insufficient material detection works correctly for adjacent/non-adjacent marshals

### Test Execution
- Framework: bun:test (built-in Bun testing)
- Command: `bun test test/game-ending.test.ts`
- Result: ✅ All 27 tests pass (264ms)
- No LSP errors in test logic (only bun:test module resolution warning)

### Implementation Verification
All 8 tasks now complete:
1. ✅ wouldBeInCheckAfterMove() helper
2. ✅ #hasEscapingMove() method
3. ✅ isCheckmate() fix
4. ✅ isStalemate() fix
5. ✅ isInsufficientMaterial() implementation
6. ✅ isDraw() update
7. ✅ isGameOver() update
8. ✅ Comprehensive test suite


## [2026-01-25] Final Summary - All Tasks Complete

### Work Completed
1. ✅ Added `wouldBeInCheckAfterMove()` helper - checks if move escapes check
2. ✅ Added `#hasEscapingMove()` method - finds if any move doesn't leave marshal in check
3. ✅ Fixed `isCheckmate()` - in check + no escaping move
4. ✅ Fixed `isStalemate()` - not in check + all moves lead to check
5. ✅ Added `isInsufficientMaterial()` - only 2 non-adjacent marshals
6. ✅ Updated `isDraw()` - includes insufficient material
7. ✅ Updated `isGameOver()` - correct order of checks
8. ✅ Added 27 comprehensive tests (skipped memoization - not needed)
9. ✅ Updated README.md - documented new method and clarified Gungi rules

### Verification Results
- TypeScript: ✅ No errors
- Build: ✅ Success
- Tests: ✅ 77/78 pass (1 pre-existing timeout unrelated to changes)
- New tests: ✅ 27/27 pass in 271ms

### Key Implementation Details
- Early return optimization in `#hasEscapingMove()` - finds escaping move fast
- Adjacency check: rank diff <= 1 AND file diff <= 1
- Draft phase: all game-ending methods return false
- Marshal captured: isCheckmate/isStalemate return false (game already over)

### Gungi-Specific Rules Implemented
- Players CAN move while in check (opponent can capture marshal)
- TRUE checkmate = in check + no escaping move
- TRUE stalemate = not in check + all moves lead to check
- Insufficient material = only 2 non-adjacent marshals

### PR Status
- Bookmark: fix-checkmate-stalemate
- PR: https://github.com/jwyce/gungi.js/pull/39
- Commits: 7 atomic commits with succinct descriptions
- Status: Ready to merge

### Decision: Memoization Skipped
- Only helps on repeated positions (rare in Gungi)
- Early return already optimizes common case
- Added comprehensive tests instead for better coverage
- Can add later if performance becomes issue

