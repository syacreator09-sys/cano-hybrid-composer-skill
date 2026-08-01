# Functional Options

## Commands

| Command | Purpose |
|---|---|
| `cano-compose doctor` | Check Node, platform and planned renderer state |
| `cano-compose validate composition.json` | Validate scene contract and required assets |
| `cano-compose plan composition.json` | Compile timing, tracks, resolution and safe zones |
| `cano-compose render composition.json --mock` | Produce timeline and render manifests without media rendering |

## Scene types

- `avatar`
- `browser`
- `videovox`
- `image`
- `diagram`
- `comparison`
- `broll`
- `result`
- `title`
- `chapter`
- `cta`

## Formats

- 9:16 at 1080 × 1920
- 16:9 at 1920 × 1080
- configurable FPS
- sequential scenes with optional tracks and fit modes

## Current limits

- Version 0.1 emits deterministic render plans but does not yet execute a real Remotion, HyperFrames or FFmpeg render.
- Captions, cursor overlays, audio normalization and visual-QA gates are planned live-render milestones.
- Every external asset must be checked for rights, privacy and provenance before publication.
