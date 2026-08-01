# Solución de problemas

## `ffmpeg` o `ffprobe` no aparecen

Instálalos en el sistema o configura sus rutas en `config/composer.local.json`.

```bash
ffmpeg -version
ffprobe -version
node bin/cano-compose.js doctor
```

## Falta un asset

Ejecuta:

```bash
node bin/cano-compose.js probe composition.json
```

Corrige la ruta antes de renderizar.

## La interfaz se recorta

Usa `fit: "contain"` para escenas `browser`.

## Aparecen barras o espacios

Es normal con `contain` cuando la relación de aspecto del asset no coincide. Diseña un fondo o usa `cover` solo cuando el recorte sea aceptable.

## El render termina sin audio

Comprueba que el asset contenga audio. Algunos clips de pantalla son silenciosos y necesitan una pista de narración externa.

## La duración queda incorrecta

Revisa `duration` en cada escena y los datos obtenidos por `probe`. No declares una duración mayor sin decidir si debe congelarse, repetirse o extenderse.

## Windows no encuentra FFmpeg

Añade FFmpeg al `PATH` o configura una ruta absoluta local. No subas esa ruta personal a Git.

## El render live no debe ejecutarse todavía

Usa:

```bash
node bin/cano-compose.js render composition.json --mock
```

Mock genera timeline y plan sin procesar medios.
