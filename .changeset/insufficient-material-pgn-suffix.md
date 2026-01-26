---
'gungi.js': patch
---

Append "=" suffix to SAN notation for insufficient material draws

Previously, the `move()` function only appended "=" for stalemate and fourfold repetition draws. Now it also appends "=" when a move results in insufficient material (only two non-adjacent marshals remaining).
