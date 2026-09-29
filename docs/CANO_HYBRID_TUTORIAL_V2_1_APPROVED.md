# CANO Hybrid Tutorial V2.1 — Approved Baseline

V2.1 is the approved composition checkpoint after the V2 alignment audit.

## Decision

Keep this architecture:

```text
2 generated visual assets
        +
HTML/CSS readable UI
        +
SVG connectors
        +
deterministic JavaScript motion
        +
frame QA
        =
CANO Hybrid Tutorial
```

## Why V2.1 replaced V2

V2 was technically valid but visually weak because its elements did not share a strong grid. Problems included title/subtitle crowding, hero/message overlap, floating AI elements, weak CRM/Agenda symmetry, inconsistent scale and an undersized final payoff.

V2.1 fixes those errors through:

- fixed 48 px internal safe margin;
- two-line title and separated subtitle;
- human hero and message as separate focal regions;
- centered AI phase;
- symmetric CRM/Agenda columns;
- removal of the floating mini-orb;
- centered action hub;
- larger result/confirmation payoff;
- consistent caption/progress alignment.

## Production rule

**If it must be read, edited, connected or precisely animated: code it.**

**If it mainly provides illustration, depth, texture, character or photographic richness: generate it as an image asset.**

Default asset count: **2**.  
Use **3** only when the story genuinely needs a third visual protagonist.

## Next version

V2.2 must preserve the V2.1 layout and improve:

- continuous secondary motion;
- transition handoffs;
- motion density;
- camera polish;
- optional 30 fps final profile.

Do not reopen the composition architecture unless a real production example demonstrates a layout failure.
