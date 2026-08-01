import path from 'node:path';

function escapeConcat(file) {
  return file.replace(/'/g, "'\\''");
}

function videoFilter(scene, timeline, config) {
  const { width, height } = timeline.resolution;
  const base = scene.fit === 'contain'
    ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:${config.backgroundColor}`
    : `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
  return `${base},fps=${timeline.fps},format=yuv420p`;
}

export function buildSceneCommand(scene, assetInfo, timeline, config, outputFile) {
  const duration = String(scene.duration);
  const commonVideo = ['-vf', videoFilter(scene, timeline, config), '-r', String(timeline.fps), '-c:v', config.videoCodec, '-preset', config.preset, '-crf', String(config.crf), '-pix_fmt', 'yuv420p'];
  const commonAudio = ['-c:a', config.audioCodec, '-ar', String(config.audioSampleRate), '-ac', String(config.audioChannels), '-shortest', '-movflags', '+faststart'];

  if (!scene.asset) {
    const color = config.backgroundColor.replace('#', '0x');
    const source = `color=c=${color}:s=${timeline.resolution.width}x${timeline.resolution.height}:r=${timeline.fps}:d=${duration}`;
    const silence = `anullsrc=r=${config.audioSampleRate}:cl=${config.audioChannels === 1 ? 'mono' : 'stereo'}`;
    const draw = scene.text ? `,drawtext=font=Sans:text='${String(scene.text).replace(/[':\\]/g, '\\$&')}':fontcolor=white:fontsize=${Math.round(timeline.resolution.width * 0.055)}:x=(w-text_w)/2:y=(h-text_h)/2` : '';
    return [config.ffmpegPath, ['-y','-f','lavfi','-i',source,'-f','lavfi','-t',duration,'-i',silence,'-vf',`${videoFilter(scene,timeline,config)}${draw}`,'-map','0:v:0','-map','1:a:0',...commonVideo.slice(2),...commonAudio,'-t',duration,outputFile]];
  }

  const extension = path.extname(scene.asset).toLowerCase();
  const isImage = ['.png','.jpg','.jpeg','.webp','.bmp'].includes(extension);
  if (isImage) {
    const silence = `anullsrc=r=${config.audioSampleRate}:cl=${config.audioChannels === 1 ? 'mono' : 'stereo'}`;
    return [config.ffmpegPath, ['-y','-loop','1','-i',assetInfo.absolute,'-f','lavfi','-t',duration,'-i',silence,'-map','0:v:0','-map','1:a:0',...commonVideo,...commonAudio,'-t',duration,outputFile]];
  }

  if (assetInfo.hasAudio) {
    return [config.ffmpegPath, ['-y','-i',assetInfo.absolute,'-map','0:v:0','-map','0:a:0',...commonVideo,'-af',`apad,atrim=0:${duration}`,...commonAudio,'-t',duration,outputFile]];
  }

  const silence = `anullsrc=r=${config.audioSampleRate}:cl=${config.audioChannels === 1 ? 'mono' : 'stereo'}`;
  return [config.ffmpegPath, ['-y','-i',assetInfo.absolute,'-f','lavfi','-t',duration,'-i',silence,'-map','0:v:0','-map','1:a:0',...commonVideo,...commonAudio,'-t',duration,outputFile]];
}

export function buildFfmpegPlan(timeline, probedAssets, config, outDir) {
  const segmentsDir = path.join(outDir, 'segments');
  const segmentCommands = timeline.scenes.map((scene, index) => {
    const output = path.join(segmentsDir, `${String(index + 1).padStart(3, '0')}-${scene.id}.mp4`);
    const assetInfo = probedAssets.find((asset) => asset.sceneId === scene.id);
    const [command, args] = buildSceneCommand(scene, assetInfo, timeline, config, output);
    return { sceneId:scene.id, command, args, output };
  });
  const concatFile = path.join(outDir, 'concat.txt');
  const concatContent = segmentCommands.map((item) => `file '${escapeConcat(path.resolve(item.output))}'`).join('\n') + '\n';
  const output = path.join(outDir, `${timeline.projectId}-${timeline.canvas.replace(':','x')}.mp4`);
  const concatCommand = { command:config.ffmpegPath, args:['-y','-f','concat','-safe','0','-i',concatFile,'-c','copy','-movflags','+faststart',output], output };
  return { version:'1.0', engine:'ffmpeg', segmentsDir, concatFile, concatContent, segmentCommands, concatCommand, output };
}
