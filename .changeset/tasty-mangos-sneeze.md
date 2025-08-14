---
'gungi.js': patch
---

🔧 prevent duplicate piece IDs in state transitions

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
