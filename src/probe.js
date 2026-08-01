import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export async function probeAsset(asset, { ffprobePath = 'ffprobe' } = {}) {
  const absolute = path.resolve(asset);
  await access(absolute);
  const result = spawnSync(ffprobePath, ['-v','error','-show_streams','-show_format','-of','json',absolute], { encoding:'utf8' });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${asset}: ${result.stderr}`);
  const body = JSON.parse(result.stdout);
  const video = body.streams?.find((stream) => stream.codec_type === 'video') ?? null;
  const audio = body.streams?.find((stream) => stream.codec_type === 'audio') ?? null;
  return {
    asset,
    absolute,
    duration: Number(body.format?.duration) || Number(video?.duration) || null,
    width: Number(video?.width) || null,
    height: Number(video?.height) || null,
    hasVideo: Boolean(video),
    hasAudio: Boolean(audio),
    videoCodec: video?.codec_name ?? null,
    audioCodec: audio?.codec_name ?? null
  };
}

export async function probeTimelineAssets(timeline, config) {
  const assets = [];
  for (const scene of timeline.scenes) {
    if (!scene.asset) { assets.push({ sceneId:scene.id, generated:true, hasVideo:true, hasAudio:false }); continue; }
    assets.push({ sceneId:scene.id, ...(await probeAsset(scene.asset, config)) });
  }
  return assets;
}
