# CANO Hybrid Tutorial V2.2

V2.2 is a **motion-only refinement** of the approved V2.1 composition.

## Rebuild

```bash
python examples/hybrid-tutorial-v2.2/apply_v22_patch.py
```

This creates `examples/hybrid-tutorial-v2.2/index.html` from the V2.1 self-contained source.

Then use the same deterministic Playwright/FFmpeg renderer documented in V2.1.

## QA vs V2.1

- Low-motion pairs: **202 → 144**
- Very-low-motion pairs: **167 → 21**
- Mean frame difference: **0.2671 → 0.3918**
- Exact adjacent duplicates: **0 → 0**

## Rule

V2.2 does not redesign the approved grid. It adds secondary motion, handoffs and microinteractions only.
