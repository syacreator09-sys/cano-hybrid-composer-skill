# Changelog

## Unreleased — Tutorial Engine V1

- Added QA Runner V1 for deterministic full-frame visual QA.
- Added dependency-free PNG decoding, luminance-diff metrics, scaling and contact-sheet composition.
- Added portable local Chromium/Chrome discovery for Windows, macOS and Linux.
- Added exact duplicate detection, hard-jump detection and keyframe geometry audits.
- Added contact and strongest-transition sheets while preserving all QA-reviewed frames for the render stage.
- Added `cano-tutorial qa` with guarded rebuilds and automated production-state transitions.


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
