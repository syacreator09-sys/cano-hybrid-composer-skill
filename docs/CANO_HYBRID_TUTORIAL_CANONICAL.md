# CANO Hybrid Tutorial — Canonical Production Method

**Current approved version:** V2.2  
**Composition baseline:** V2.1  
**Status:** GOLDEN CHECKPOINT

This document is the production memory for creating future CANO Hybrid Tutorials without reconstructing the method from chat history.

## Canonical formula

```text
BRIEF
→ STORYBOARD
→ 2 GENERATED VISUAL ASSETS (3 only if justified)
→ HTML/CSS readable UI
→ SVG connectors/paths
→ deterministic JavaScript motion
→ optional Canvas FX
→ keyframe QA
→ full-frame render
→ temporal QA
→ silent MP4 master
→ ElevenLabs voice/music/SFX only after visual approval
```

## The core rule

**If it must be read, edited, connected, aligned or precisely animated: CODE IT.**

**If it mainly adds photographic, illustrative, 3D, character, texture or depth value: GENERATE IT AS AN IMAGE ASSET.**

Do not generate the whole tutorial as one infographic.

## Asset policy

Default: **2 generated images**.

Examples:
1. Human / phone / product / main subject.
2. AI orb / object / supporting visual.

Use a third asset only when the story genuinely requires another visual protagonist.

Generated images should:
- avoid critical baked-in text;
- avoid arrows and process diagrams;
- have clean negative space;
- share lighting/perspective/style;
- be easy to crop or isolate;
- not attempt to explain the whole workflow.

## Composition grammar

Each phase has one clear protagonist.

```text
1. INPUT
   human + message

2. UNDERSTAND
   AI + extracted structured data

3. ACT
   CRM + Agenda in a symmetric coded layout

4. RESULT
   one large confirmation payoff
```

### Locked V2.1 layout principles
- two-line title with clean subtitle separation;
- fixed safe margin;
- human and message do not compete;
- AI is centered;
- CRM and Agenda are symmetric;
- no floating mini-orb between panels;
- result card is large and centered;
- footer/progress stays on one grid.

## V2.2 motion grammar

V2.2 improves motion without redesigning the composition.

Approved techniques:
- subtle monotonic background drift;
- hero micro push-in;
- one-pass AI orbit accent;
- staggered data pills;
- visible understand → action handoff;
- animated SVG connector dashes;
- sequential CRM row activation;
- calendar day and slot microinteractions;
- result-card information cascade;
- one-pass confirmation accent.

Avoid:
- primary looping motion;
- oscillation for the sake of motion;
- random zooms;
- fades as the only transition;
- multiple simultaneous focal points;
- layout changes during a motion-only revision.

## Deterministic render contract

Current approved profile:

```text
Internal canvas: 720x1280
Final master:    1080x1920
FPS:             24
Duration:        12.000 s
Frames:          288
Codec:           H.264
Audio:           none during visual QA
```

The timeline must expose a deterministic function equivalent to:

```js
renderAt(frame)
```

Every frame must be reproducible.

## QA gates

### A. Keyframe composition QA
Before full render inspect:
- hook;
- message phase;
- AI phase;
- CRM / Agenda phase;
- confirmation phase.

Reject if:
- safe-area violation;
- overlap/collision;
- ambiguous hierarchy;
- inconsistent scale;
- weak final payoff.

### B. Full temporal QA
Check:
- exact frame count;
- exact duration;
- no truncated encode;
- no accidental loop;
- no exact adjacent duplicate frames;
- no long static holds;
- transitions sampled densely;
- lifecycle is enter → act → handoff/exit.

### V2.2 measured benchmark

```text
V2.1 low-motion pairs <0.18:      202
V2.2 low-motion pairs <0.18:      144

V2.1 very-low-motion pairs <0.08: 167
V2.2 very-low-motion pairs <0.08: 21

V2.1 mean frame diff:              0.2671
V2.2 mean frame diff:              0.3918

Exact adjacent duplicates:         0
```

## Audio policy

Do not add audio until the silent visual master is approved.

Audio layer:
- ElevenLabs voice
- ElevenLabs music
- ElevenLabs SFX

The audio system is separate from the visual renderer.

## Repository map

- `examples/hybrid-tutorial-v2.1/` — approved composition baseline.
- `examples/hybrid-tutorial-v2.2/` — approved motion pass.
- `config/hybrid-tutorial-v2.1.json` — composition rules.
- `config/hybrid-tutorial-v2.2.json` — motion rules.
- `docs/CANO_HYBRID_TUTORIAL_V2_1_APPROVED.md` — why V2.1 fixed V2.
- This file — canonical production memory.

## How to produce the next tutorial

1. Write a four-phase story.
2. Decide the two visual assets.
3. Generate only those assets.
4. Build all readable UI in HTML/CSS.
5. Build connections in SVG.
6. Implement deterministic `renderAt(frame)`.
7. Validate keyframes before rendering everything.
8. Render the silent master.
9. Run temporal QA.
10. Only then add ElevenLabs audio.

## Next validation gate

Do **not** keep polishing the same appointment example indefinitely.

The next proof should use V2.2 on a different topic, such as:

```text
WhatsApp → n8n → AI → CRM
```

If the template works cleanly on a second real topic, V2.2 can be promoted from golden checkpoint to general production template.
