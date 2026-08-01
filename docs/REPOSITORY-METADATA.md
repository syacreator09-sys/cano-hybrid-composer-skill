# Metadatos recomendados para GitHub

## Descripción

```text
FFmpeg/Remotion-ready skill for composing avatar, browser, VideoVox, images, captions and audio into vertical and horizontal tutorials.
```

## Topics

```text
ffmpeg
remotion
video-composition
tutorial-generator
short-video
youtube
claude-code
codex
```

## Propósito

Este repositorio es el ensamblador audiovisual. Consume assets producidos por otros skills y genera timelines, planes y renders.

## Tecnologías

- Node.js 20+
- FFmpeg y FFprobe
- contratos JSON
- arquitectura preparada para Remotion/HyperFrames

## Entrada

Composición JSON con canvas, FPS, escenas, assets, duración, fit y orden.

## Salida

- timeline normalizado;
- reporte de assets;
- plan de render;
- MP4 final cuando se utiliza live;
- manifiesto de composición.

## Relación con la Suite

`cano-tutorial-suite` ejecuta este skill al final del workflow. No conoce llaves de HeyGen ni sesiones Playwright.
