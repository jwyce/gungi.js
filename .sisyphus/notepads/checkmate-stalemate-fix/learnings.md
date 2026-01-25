
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
