# Changelog

## Unreleased — Tutorial Engine V1

- Added Audio Layer V1 for post-approval external audio ingestion and local publication mixing.
- Added SHA-256 locking + ffprobe validation for voice, optional SFX and optional music.
- Added publication-master mix with approved video stream copy, 48 kHz stereo AAC and exact frame validation.
- Added `audio-register`, `audio-mix` and `audio-status` CLI commands.
- Preserved provider boundary: ElevenLabs generation remains external to the repository.

- Added Mode Builder V1 for deterministic per-project HTML/JS generation.
- Added Screen Tutorial V1.2 parameterization with real embedded n8n/WhatsApp SVG assets.
- Added Explainer V2.2 reconstruction and project-content adaptation.
- Added a code-first Workflow builder with configurable nodes and structured result states.
- Added guarded source rebuilds and source-built production state transitions.

- Added Production Runner V1 for safe local production workspaces.
- Added baseline materialization with SHA-256 integrity locks.
- Added mode-specific storyboard and asset/logo slot scaffolds.
- Added QA, render and audio-gate plans.
- Added safe --force rebuild protection and workspace status/integrity inspection.

- Added a deterministic router for Explainer, Workflow and Screen Tutorial modes.
- Added a tutorial manifest compiler with output, safe-zone, asset, audio and QA policies.
- Added the `cano-tutorial` planning CLI.
- Added tests for routing and production-plan compilation.
- Preserved external-provider boundaries: the repository plans audio but does not call providers.


## 0.3.0

- Frozen the approved CANO Hybrid Tutorial V2.1 composition baseline.
- Added a self-contained deterministic HTML/JS example using two generated visual assets.
- Added production manifest, reproduction guide, renderer and frame-QA script.
- Documented the canonical split: image assets for visual richness; code for readable UI, connectors, timing and lifecycle.
- Preserved V2.1 layout as the baseline for V2.2 motion-density refinements.

## 0.2.0

- Configuración guiada y diagnóstico FFmpeg.
- Validación y probe de assets.
- Renderer FFmpeg local opt-in.
- Resolución de assets relativa al archivo de composición.
- Soporte para títulos y capítulos generados.
- Documentación Mac/Windows y troubleshooting.
- Metadatos recomendados para GitHub.
- Verificación local sin GitHub Actions.

## 0.1.0

- Contrato universal de escenas.
- Timeline y plan de render deterministas.
- Modo mock inicial.
