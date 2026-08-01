import process from 'node:process';
import { loadComposerConfig } from './config.js';
import { commandVersion } from './process.js';

export async function runComposerDoctor({ configFile = 'config/composer.local.json' } = {}) {
  const { config, file, exists } = await loadComposerConfig(configFile);
  const ffmpeg = commandVersion(config.ffmpegPath);
  const ffprobe = commandVersion(config.ffprobePath);
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  return {
    ok: nodeMajor >= 20 && exists && ffmpeg.ok && ffprobe.ok,
    node:process.version,
    nodeSupported:nodeMajor >= 20,
    platform:process.platform,
    arch:process.arch,
    configFile:file,
    configExists:exists,
    renderer:config.renderer,
    ffmpeg,
    ffprobe,
    nextSteps:[
      ...(!exists ? ['Run: cano-compose init'] : []),
      ...(!ffmpeg.ok ? ['Install FFmpeg and configure ffmpegPath'] : []),
      ...(!ffprobe.ok ? ['Install ffprobe and configure ffprobePath'] : [])
    ]
  };
}
