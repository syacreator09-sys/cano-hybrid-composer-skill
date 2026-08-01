import { readFile } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { normalizeComposerConfig, saveComposerConfig } from './config.js';

function yes(value, fallback) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return fallback;
  return ['y','yes','s','si','sí','1','true'].includes(text);
}

export async function runComposerSetup({ seedFile, outputFile = 'config/composer.local.json' } = {}) {
  if (seedFile) return saveComposerConfig(JSON.parse(await readFile(seedFile, 'utf8')), outputFile);
  const rl = readline.createInterface({ input, output });
  try {
    output.write('\nCANO Hybrid Composer setup\n\n');
    const ffmpegPath = (await rl.question('Ruta/comando de FFmpeg (ffmpeg): ')).trim() || 'ffmpeg';
    const ffprobePath = (await rl.question('Ruta/comando de ffprobe (ffprobe): ')).trim() || 'ffprobe';
    const crf = Number(await rl.question('Calidad H.264 CRF 0-51 (20): '));
    const preset = (await rl.question('Preset de codificación (medium): ')).trim() || 'medium';
    const backgroundColor = (await rl.question('Color de fondo #RRGGBB (#111111): ')).trim() || '#111111';
    const keepIntermediates = yes(await rl.question('¿Conservar segmentos normalizados? [s/N]: '), false);
    const maxDurationSeconds = Number(await rl.question('Duración máxima permitida en segundos (1800): ')) || 1800;
    return saveComposerConfig(normalizeComposerConfig({ ffmpegPath, ffprobePath, crf: Number.isFinite(crf) ? crf : 20, preset, backgroundColor, keepIntermediates, maxDurationSeconds }), outputFile);
  } finally { rl.close(); }
}
