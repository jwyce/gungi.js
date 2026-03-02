---
"gungi.js": patch
---

Restrict leap-over behavior for jumping pieces to forward movement only.

- Cannon, archer, and musketeer can no longer jump over blockers when moving sideways or backward.
- Added movement regression tests that verify forward leaps remain legal and non-forward leaps are blocked.
