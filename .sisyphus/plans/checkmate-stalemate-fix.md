# Fix Checkmate, Stalemate, and Insufficient Material Detection

## Context

### Original Request

Fix incorrect checkmate/stalemate implementation in gungi.js. Gungi allows moving while in check (opponent can capture marshal), but TRUE checkmate/stalemate should end the game.

### Key Gungi Rules

- Players CAN move any piece while in check (even into check)
- Opponent can then capture marshal to win - this is intentional
- Only TRUE checkmate (no escape) or stalemate (all moves lead to check) ends game

---

## Work Objectives

### Core Objective

Fix game-ending detection to properly handle checkmate, stalemate, and insufficient material per Gungi rules.

### Concrete Deliverables

- Fixed `isCheckmate()` - in check + no escaping move
- Fixed `isStalemate()` - not in check + all moves lead to check
- New `isInsufficientMaterial()` - only 2 non-adjacent marshals remain
- Updated `isDraw()` and `isGameOver()`
- PGN notation: `#` for checkmate, `=` for draws

### Definition of Done

- [x] `isCheckmate()` true only when in check AND no move escapes check
- [x] `isStalemate()` true only when NOT in check AND every move leads to check
- [x] `isInsufficientMaterial()` true when only 2 marshals (no hand/board pieces), not adjacent
- [x] PGN ends with `#` for checkmate, `=` for draws

### Must NOT Have

- Filtering moves when in check (players CAN move into check)
- Breaking existing marshal-capture detection
- Changing move generation logic

---

## TODOs

- [x] 1. Add `wouldBeInCheckAfterMove()` helper

  **What to do**:

  - Add export to `src/gungi/move_gen.ts`
  - Takes a Move object (which has `after` FEN and `color`)
  - Returns true if player who moved is still in check after the move
  - Use existing `inCheck()` function with the `after` FEN

  **References**:

  - `src/gungi/move_gen.ts:409-422` - existing `inCheck()` implementation
  - `src/gungi/types.ts` - Move type definition

  **Acceptance Criteria**:

  - [ ] Function exported from move_gen.ts
  - [ ] Returns correct boolean for check state after move

---

- [x] 2. Add `#hasEscapingMove()` private method

  **What to do**:

  - Add to `src/gungi/gungi.ts`
  - Generate all possible moves (board squares + hand arata)
  - For each move, check if `wouldBeInCheckAfterMove()` returns false
  - Return true if ANY move escapes check, false if none do
  - Early return on first escaping move found (performance)

  **References**:

  - `src/gungi/gungi.ts:239-252` - existing `#hasNoLegalMoves()` pattern
  - `src/gungi/move_gen.ts:104-182` - `generateMovesForSquare()`
  - `src/gungi/move_gen.ts:184-230` - `generateArata()`

  **Acceptance Criteria**:

  - [ ] Returns true when at least one move doesn't leave marshal in check
  - [ ] Returns false when all moves leave marshal in check
  - [ ] Checks both board moves and hand (arata) moves

---

- [x] 3. Fix `isCheckmate()`

  **What to do**:

  - Edit `src/gungi/gungi.ts` lines 259-263
  - Change logic: `return this.inCheck() && !this.#hasEscapingMove()`
  - Add early returns for draft phase and already-captured marshal

  **References**:

  - `src/gungi/gungi.ts:259-263` - current implementation

  **Acceptance Criteria**:

  - [ ] Returns true only when: in check AND no escaping move exists
  - [ ] Returns false during draft phase
  - [ ] Returns false if marshal already captured

---

- [x] 4. Fix `isStalemate()`

  **What to do**:

  - Edit `src/gungi/gungi.ts` lines 265-269
  - Change logic: `return !this.inCheck() && !this.#hasEscapingMove()`
  - Add early returns for draft phase and already-captured marshal

  **References**:

  - `src/gungi/gungi.ts:265-269` - current implementation

  **Acceptance Criteria**:

  - [ ] Returns true only when: NOT in check AND every move leads to check
  - [ ] Returns false during draft phase
  - [ ] Returns false if marshal already captured

---

- [x] 5. Add `isInsufficientMaterial()`

  **What to do**:

  - Add new public method to `src/gungi/gungi.ts`
  - Check hand has no non-marshal pieces
  - Check board has only 2 marshals (one per color)
  - Check marshals are NOT adjacent (rank/file diff both > 1)
  - Return true only if all conditions met

  **References**:

  - `src/gungi/gungi.ts:271-273` - `isDraw()` to update
  - `src/gungi/constants.ts` - `MARSHAL` piece type

  **Acceptance Criteria**:

  - [ ] Returns false if any piece in hand besides marshals
  - [ ] Returns false if any piece on board besides marshals
  - [ ] Returns false if marshals are adjacent (can capture)
  - [ ] Returns true only when 2 non-adjacent marshals, nothing else

---

- [x] 6. Update `isDraw()`

  **What to do**:

  - Edit `src/gungi/gungi.ts` line 271-273
  - Add `this.isInsufficientMaterial()` to the return

  **References**:

  - `src/gungi/gungi.ts:271-273` - current implementation

  **Acceptance Criteria**:

  - [ ] Returns true for stalemate OR fourfold repetition OR insufficient material

---

- [x] 7. Update `isGameOver()`

  **What to do**:

  - Edit `src/gungi/gungi.ts` lines 275-280
  - Add insufficient material check before checkmate/stalemate

  **References**:

  - `src/gungi/gungi.ts:275-280` - current implementation

  **Acceptance Criteria**:

  - [ ] Includes insufficient material as game-ending condition
  - [ ] Order: draft check → marshal captured → fourfold → insufficient → checkmate/stalemate

---

- [x] 8. Add memoization for `#hasEscapingMove()` (optional perf) - SKIPPED

  **Decision**: Skipped - memoization only helps on repeated positions (rare). Early return already optimizes common case. Added comprehensive tests instead.

  **What was done instead**:

  - Added 27 comprehensive tests in `test/game-ending.test.ts`
  - All tests passing (271ms)
  - Covers: checkmate, stalemate, insufficient material, draft phase, marshal captured, Gungi-specific rules

---

## Edge Cases

| Scenario                              | Result          |
| ------------------------------------- | --------------- |
| In check, can escape                  | Game continues  |
| In check, no escape                   | Checkmate (`#`) |
| Not in check, has safe move           | Game continues  |
| Not in check, all moves lead to check | Stalemate (`=`) |
| 2 marshals only, adjacent             | Game continues  |
| 2 marshals only, not adjacent         | Draw (`=`)      |
| Marshal captured                      | Game over (`#`) |

---

---

- [x] 9. Update README.md

  **What to do**:

  - Add `### .isInsufficientMaterial()` section after `.isGameOver()`
  - Document: returns true when only 2 non-adjacent marshals remain (no other pieces on board or in hand)
  - Update `.isDraw()` description to mention insufficient material
  - Update `.isCheckmate()` and `.isStalemate()` descriptions to clarify Gungi-specific rules

  **References**:

  - `README.md:497-542` - existing `.isCheckmate()`, `.isDraw()`, `.isGameOver()`, `.isStalemate()` docs

  **Acceptance Criteria**:

  - [ ] New `.isInsufficientMaterial()` section added with example
  - [ ] `.isDraw()` mentions insufficient material
  - [ ] Descriptions accurate to Gungi rules

---

## Files Modified

1. `src/gungi/move_gen.ts` - Add `wouldBeInCheckAfterMove()`
2. `src/gungi/gungi.ts` - All other changes
3. `README.md` - Document new method and update descriptions

## Commit Strategy (jj)

Atomic commits per task with succinct descriptions:

- ✅ After task 1: `add wouldBeInCheckAfterMove helper`
- ✅ After task 2: `add hasEscapingMove method`
- ✅ After tasks 3-4: `fix checkmate/stalemate detection`
- ✅ After tasks 5-6: `add insufficient material detection`
- ✅ After task 7: `update isGameOver`
- ✅ After task 8: `add comprehensive game-ending tests` (instead of memoization)
- ✅ After task 9: `update readme`

✅ Bookmark created: `fix-checkmate-stalemate`
✅ PR opened: https://github.com/jwyce/gungi.js/pull/39
