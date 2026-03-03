---
'gungi.js': patch
---

Allow tactician betrayal move generation when moving onto a friendly-topped tower with enemy pieces underneath.

- Generate `謀(... )返X` for onboard tactician stacks with convertible enemy pieces below a friendly top piece.
- Preserve existing arata betrayal behavior.
- Add regression coverage for onboard betray generation and execution.
