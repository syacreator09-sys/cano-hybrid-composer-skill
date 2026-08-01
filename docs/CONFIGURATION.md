# Configuración del compositor

## Inicialización

```bash
node bin/cano-compose.js init
```

El asistente crea `config/composer.local.json`, ignorado por Git.

También puedes usar:

```bash
node bin/cano-compose.js init --from config/composer.example.json
```

## Campos principales

```json
{
  "version": "1.0",
  "runtimeDir": ".runtime",
  "renderer": "ffmpeg",
  "ffmpegPath": "ffmpeg",
  "ffprobePath": "ffprobe",
  "defaults": {
    "fps": 30,
    "videoCodec": "libx264",
    "audioCodec": "aac",
    "crf": 20,
    "preset": "medium"
  }
}
```

## Renderer

`ffmpeg` es el renderer live soportado en v0.2. `mock` permanece disponible mediante el flag del CLI.

## Rutas

Usa rutas relativas al archivo de composición o rutas absolutas. No guardes rutas personales dentro de ejemplos públicos.

## Assets

Cada escena con contenido audiovisual debe incluir `asset`. Los títulos y capítulos pueden evolucionar hacia generación nativa de texto, pero en v0.2 deben tratarse como elementos planificados.

## Fit

- `contain`: conserva toda la interfaz o imagen y puede dejar espacio libre.
- `cover`: llena el canvas y puede recortar bordes.

Para capturas de navegador se recomienda `contain`.

## Diagnóstico

```bash
node bin/cano-compose.js doctor
node bin/cano-compose.js probe composition.json
```

`probe` inspecciona assets con `ffprobe` antes de renderizar.
