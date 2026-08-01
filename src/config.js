import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_COMPOSER_CONFIG = Object.freeze({
  version: '1.0',
  runtimeDir: '.runtime',
  renderer: 'ffmpeg',
  ffmpegPath: 'ffmpeg',
  ffprobePath: 'ffprobe',
  videoCodec: 'libx264',
  audioCodec: 'aac',
  crf: 20,
  preset: 'medium',
  audioSampleRate: 48000,
  audioChannels: 2,
  backgroundColor: '#111111',
  keepIntermediates: false,
  maxDurationSeconds: 1800
});

export function normalizeComposerConfig(input = {}) {
  return {
    version: '1.0',
    runtimeDir: input.runtimeDir || DEFAULT_COMPOSER_CONFIG.runtimeDir,
    renderer: input.renderer || DEFAULT_COMPOSER_CONFIG.renderer,
    ffmpegPath: input.ffmpegPath || DEFAULT_COMPOSER_CONFIG.ffmpegPath,
    ffprobePath: input.ffprobePath || DEFAULT_COMPOSER_CONFIG.ffprobePath,
    videoCodec: input.videoCodec || DEFAULT_COMPOSER_CONFIG.videoCodec,
    audioCodec: input.audioCodec || DEFAULT_COMPOSER_CONFIG.audioCodec,
    crf: Number.isFinite(Number(input.crf)) ? Number(input.crf) : DEFAULT_COMPOSER_CONFIG.crf,
    preset: input.preset || DEFAULT_COMPOSER_CONFIG.preset,
    audioSampleRate: Number(input.audioSampleRate) || DEFAULT_COMPOSER_CONFIG.audioSampleRate,
    audioChannels: Number(input.audioChannels) || DEFAULT_COMPOSER_CONFIG.audioChannels,
    backgroundColor: input.backgroundColor || DEFAULT_COMPOSER_CONFIG.backgroundColor,
    keepIntermediates: typeof input.keepIntermediates === 'boolean' ? input.keepIntermediates : false,
    maxDurationSeconds: Number(input.maxDurationSeconds) || DEFAULT_COMPOSER_CONFIG.maxDurationSeconds
  };
}

export function validateComposerConfig(config) {
  const errors = [];
  if (!['ffmpeg', 'plan-only'].includes(config?.renderer)) errors.push('renderer must be ffmpeg or plan-only');
  if (!(config?.crf >= 0 && config?.crf <= 51)) errors.push('crf must be 0-51');
  if (!(config?.audioSampleRate >= 8000 && config?.audioSampleRate <= 192000)) errors.push('audioSampleRate invalid');
  if (![1, 2].includes(config?.audioChannels)) errors.push('audioChannels must be 1 or 2');
  if (!(config?.maxDurationSeconds > 0 && config?.maxDurationSeconds <= 21600)) errors.push('maxDurationSeconds invalid');
  if (!/^#[0-9a-f]{6}$/i.test(config?.backgroundColor ?? '')) errors.push('backgroundColor must be #RRGGBB');
  return { ok: errors.length === 0, errors };
}

export async function loadComposerConfig(file = 'config/composer.local.json') {
  try {
    const config = normalizeComposerConfig(JSON.parse(await readFile(file, 'utf8')));
    const check = validateComposerConfig(config);
    if (!check.ok) throw new Error(check.errors.join('; '));
    return { config, file: path.resolve(file), exists: true };
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return { config: normalizeComposerConfig(), file: path.resolve(file), exists: false };
  }
}

export async function saveComposerConfig(input, file = 'config/composer.local.json') {
  const config = normalizeComposerConfig(input);
  const check = validateComposerConfig(config);
  if (!check.ok) throw new Error(check.errors.join('; '));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return { file: path.resolve(file), config };
}
