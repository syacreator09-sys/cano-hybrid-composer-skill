# CANO Hybrid Composer Skill

Skill multiplataforma para combinar grabaciones de pantalla, segmentos HeyGen, escenas VideoVox, imágenes, diagramas, B-roll y audio en videos verticales u horizontales.

> Estado: **v0.2 clone-ready**. El modo mock genera timelines y planes reproducibles. El modo live ejecuta un render FFmpeg local cuando los assets existen y el operador lo autoriza.

## Responsabilidad

Este repositorio:

- valida contratos universales de escenas;
- calcula timeline, resolución, FPS y safe zones;
- verifica existencia y características de assets;
- normaliza cada clip o imagen;
- concatena las escenas mediante FFmpeg;
- genera manifiestos y resultados revisables.

No navega sitios, no llama HeyGen, no genera escenas VideoVox y no publica contenido.

## Instalación

```bash
git clone https://github.com/syacreator09-sys/cano-hybrid-composer-skill.git
cd cano-hybrid-composer-skill
npm install
npm run init
npm run verify
```

Además instala FFmpeg y confirma:

```bash
ffmpeg -version
ffprobe -version
node bin/cano-compose.js doctor
```

## Primera prueba segura

```bash
node bin/cano-compose.js validate examples/avatar-screen-short.json
node bin/cano-compose.js plan examples/avatar-screen-short.json
node bin/cano-compose.js render examples/avatar-screen-short.json --mock
```

## Render local real

1. Coloca los assets en rutas locales válidas.
2. Revisa duración, canvas, fit y orden de escenas.
3. Ejecuta:

```bash
node bin/cano-compose.js render composition.json --live
```

El render live requiere FFmpeg y nunca se activa implícitamente.

## Tipos de escena

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

## Formatos

- `9:16` — 1080 × 1920.
- `16:9` — 1920 × 1080.
- FPS configurable.
- `contain` o `cover` por escena.

## Comandos

```text
cano-compose --help
cano-compose --version
cano-compose init
cano-compose doctor
cano-compose validate composition.json
cano-compose plan composition.json
cano-compose probe composition.json
cano-compose render composition.json --mock|--live
```

## Documentación

- [Configuración](docs/CONFIGURATION.md)
- [Opciones y escenas](docs/OPTIONS.md)
- [Solución de problemas](docs/TROUBLESHOOTING.md)
- [Metadatos recomendados para GitHub](docs/REPOSITORY-METADATA.md)
- [Seguridad](SECURITY.md)
- [Privacidad](PRIVACY.md)
- [Uso responsable](USAGE_POLICY.md)
- [Marca e identidad](BRAND_AND_IDENTITY.md)
- [Avisos de terceros](THIRD_PARTY_NOTICES.md)
- [Contribución](CONTRIBUTING.md)
- [Licencia MIT](LICENSE)

## Límites v0.2

- El renderer live actual es FFmpeg secuencial; los overlays avanzados, captions dinámicos y motion graphics pueden añadirse después mediante Remotion/HyperFrames.
- Los archivos deben existir antes del render.
- La duración declarada debe ser compatible con el asset.
- La revisión visual, privacidad, derechos y sincronización continúa siendo humana.

La verificación es local y este repositorio no contiene GitHub Actions.


## Approved production example: Hybrid Tutorial V2.1

The approved code-driven tutorial checkpoint lives at:

- [examples/hybrid-tutorial-v2.1](examples/hybrid-tutorial-v2.1/)
- [V2.1 production manifest](examples/hybrid-tutorial-v2.1/PRODUCTION_MANIFEST.json)
- [Approved composition notes](docs/CANO_HYBRID_TUTORIAL_V2_1_APPROVED.md)

V2.1 uses **2 generated visual assets + HTML/CSS UI + SVG connectors + deterministic JavaScript motion**. Critical readable text stays in code. No generative video model is used for the motion layer.


## CANO Hybrid Tutorial — golden checkpoint

The current approved production method is **V2.2**.

- [Canonical production method](docs/CANO_HYBRID_TUTORIAL_CANONICAL.md)
- [V2.1 approved composition](examples/hybrid-tutorial-v2.1/)
- [V2.2 approved motion pass](examples/hybrid-tutorial-v2.2/)
- [V2.2 golden checkpoint](examples/hybrid-tutorial-v2.2/GOLDEN_CHECKPOINT.md)

Future tutorial work should start from these files instead of reconstructing the format from memory.


## CANO Screen Tutorial Mode

The third production mode is now frozen as a stable example:

- [Screen Tutorial Mode V1](docs/CANO_SCREEN_TUTORIAL_MODE.md)
- [Approved Test 3](examples/screen-tutorial-test3/)

It supports cursor, clicks, zoom/pan, highlights, application-state changes and real SVG/PNG brand logos.


## CANO Tutorial Engine V1

The three validated production formats are now unified behind a deterministic router:

- **Explainer Mode** → Hybrid Tutorial V2.2
- **Workflow Mode** → Hybrid Tutorial V2.2
- **Screen Tutorial Mode** → Screen Tutorial V1.2

Quick routing:

```bash
cano-tutorial route "Cómo conectar WhatsApp a n8n paso a paso"
```

Manifest planning:

```bash
cano-tutorial plan examples/tutorial-engine-v1/screen-tutorial.json
```

The engine plans and routes only. It does not call external render/audio providers and does not spend credits.

See:
- [CANO Tutorial Engine V1](docs/CANO_TUTORIAL_ENGINE_V1.md)
- [Example manifests](examples/tutorial-engine-v1/)
- [Engine config](config/tutorial-engine-v1.json)


## Production Runner V1

CANO Tutorial Engine can now materialize a safe local production workspace from a manifest:

```bash
cano-tutorial build examples/tutorial-engine-v1/screen-tutorial.json
```

Inspect baseline integrity and production state:

```bash
cano-tutorial status .runtime/tutorial-engine/jobs/whatsapp-n8n-screen
```

The runner creates storyboard, asset/logo slots, QA gates, silent-render plan, audio gate, state, a baseline lockfile and copies only the approved baseline source files.

It does not render media, publish content or call paid/external providers.

See [Production Runner V1](docs/PRODUCTION_RUNNER_V1.md).


## Mode Builder V1

Production workspaces can now be converted into per-project deterministic HTML/JS:

```bash
cano-tutorial source .runtime/tutorial-engine/jobs/whatsapp-n8n-screen
```

Mode Builder V1 supports:

- Screen Tutorial V1.2 with real n8n/WhatsApp SVG assets;
- Hybrid Explainer V2.2 content adaptation;
- code-first Workflow generation.

The generated source lives in `source/project/` and makes no provider calls or external spend.

See [Mode Builder V1](docs/MODE_BUILDER_V1.md).


## QA Runner V1

Source-built tutorials can be rendered frame-by-frame for deterministic visual QA:

```bash
cano-tutorial qa .runtime/tutorial-engine/jobs/<projectId>
```

QA Runner V1 uses local Chromium + Python Playwright, blocks external HTTP/HTTPS requests, checks exact frame count, adjacent duplicates, transition density and critical geometry, and writes contact/transition sheets under `.runtime/`. Automated QA never grants human visual approval and never activates audio or publishing.

See [QA Runner V1](docs/QA_RUNNER_V1.md).


## Render Runner V1

After automated visual QA passes, encode the exact reviewed PNG sequence into a silent H.264 master:

```bash
cano-tutorial render .runtime/tutorial-engine/jobs/<projectId>
```

Render Runner V1 does **not** reopen the HTML or create a second animation sequence. It hashes the QA frame sequence, encodes those frames locally with FFmpeg, verifies codec/resolution/FPS/frame count/no-audio with ffprobe, and leaves `visualApproved=false` for the human approval gate.

See [Render Runner V1](docs/RENDER_RUNNER_V1.md).
