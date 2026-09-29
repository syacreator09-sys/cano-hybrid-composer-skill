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
