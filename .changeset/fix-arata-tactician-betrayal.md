---
'gungi.js': patch
---

Fix tactician arata betrayal generation when stacking onto a friendly-topped tower.

- Allow `新謀(... )返X` move generation for this niche arata case.
- Apply betrayal conversion and hand consumption correctly for arata betrayal moves.
- Add regression coverage for both white and black variants.
