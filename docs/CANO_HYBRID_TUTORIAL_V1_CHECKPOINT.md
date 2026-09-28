# CANO Hybrid Tutorial — V1 Checkpoint

Status: **APPROVED BASELINE / CHECKPOINT**
Date: 2026-09-28

## Purpose

Freeze the first usable hybrid tutorial format before starting V2.

The format combines generated visual assets with deterministic code-driven motion. Generated images provide visual richness; readable information and motion logic stay editable in code.

## Canonical architecture

```text
BRIEF
  -> STORYBOARD
  -> 2–3 GENERATED VISUAL ASSETS
  -> HTML/CSS UI + readable text
  -> SVG connectors/paths
  -> JavaScript deterministic timeline
  -> Canvas optional FX
  -> frame-by-frame QA
  -> MP4
  -> optional ElevenLabs audio layer
```

## Division of responsibilities

### Generated image assets

Use generated imagery only for visual subjects that benefit from illustration, depth, texture or photorealism.

Recommended:
- phone/device
- AI character/orb
- calendar/dashboard object
- product/person/scene support

Rules:
- 1 clear protagonist per asset
- normally 2 assets; maximum 3 unless justified
- no tutorial titles baked into images
- no arrows or process diagrams baked into images
- no critical text baked into images
- clean or transparent background when possible
- consistent perspective, lighting and art direction
- generous negative space for animation

### Code

Anything that must remain readable, editable, connectable or precisely timed belongs in code.

HTML/CSS:
- titles and subtitles
- cards and popups
- messages
- CRM/calendar UI
- labels and buttons
- result states

SVG:
- arrows
- connectors
- paths
- progress indicators
- diagrams

JavaScript:
- deterministic sceneAt(frame/time)
- lifecycle windows
- camera motion
- entrances/exits
- morph-style handoffs
- highlighting
- timing

Canvas:
- particles
- trails
- glow
- lightweight procedural FX

## V1 production rules

1. Image = visual look.
2. Code = explanation and motion.
3. Never animate one giant infographic as the primary method.
4. Do not bake critical text into image assets.
5. Every object has an explicit lifecycle: enter -> act/transform -> exit/handoff.
6. Avoid long holds and cyclic primary motion.
7. One clear visual protagonist per beat.
8. Maintain mobile safe areas.
9. Render a silent visual master first.
10. Audio is a separate layer; ElevenLabs is for voice, music and SFX.

## Default output

- vertical 9:16
- target master 1080x1920
- 30 fps preferred for final delivery
- H.264 MP4
- silent QA master first
- source HTML/JS kept alongside the project

## Required QA gates

### Technical
- exact duration
- expected frame count
- no corrupt/truncated render
- no accidental loop

### Geometry
- no text outside safe area
- no collisions
- minimum readable text size
- no clipped primary objects

### Temporal
- inspect every transition densely
- detect micro-holds
- no lifecycle accumulation
- no return to previous compositions unless intentional

### Visual
- frozen keyframes still look designed
- one clear hierarchy per beat
- camera serves legibility
- no unnecessary clutter
- final result is unmistakable

## V1 reference story

```text
message -> AI understands -> CRM/context -> availability -> confirmation
```

The V1 experiment proved the hybrid model is viable. V2 should improve quality without changing the core architecture.

## V2 targets

- better asset generation prompts
- cleaner transparent/isolated assets
- 2–3 asset compositions chosen intentionally
- stronger morph/handoff logic
- more consistent camera grammar
- reusable layout tokens and safe zones
- automated collision/overflow checks
- automated low-motion / hold detection
- reusable tutorial manifest
- 1080x1920 render pipeline as the default
