---
'gungi.js': patch
---

🎯 optimize ID reassignment to minimize swaps

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
