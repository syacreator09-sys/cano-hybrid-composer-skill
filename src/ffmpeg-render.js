import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildFfmpegPlan } from './ffmpeg-plan.js';
import { probeTimelineAssets } from './probe.js';
import { runCommand } from './process.js';

export async function renderWithFfmpeg(timeline, outDir, config, { onLine } = {}) {
  if (timeline.duration > config.maxDurationSeconds) throw new Error(`timeline duration ${timeline.duration}s exceeds configured maximum ${config.maxDurationSeconds}s`);
  await mkdir(outDir, { recursive:true });
  const probedAssets = await probeTimelineAssets(timeline, config);
  const plan = buildFfmpegPlan(timeline, probedAssets, config, outDir);
  await mkdir(plan.segmentsDir, { recursive:true });
  await writeFile(plan.concatFile, plan.concatContent);
  await writeFile(path.join(outDir, 'ffmpeg-plan.json'), `${JSON.stringify(plan, null, 2)}\n`);
  const completed = [];
  for (const item of plan.segmentCommands) {
    await runCommand(item.command, item.args, { onLine });
    completed.push({ sceneId:item.sceneId, output:path.relative(outDir, item.output).split(path.sep).join('/') });
  }
  await runCommand(plan.concatCommand.command, plan.concatCommand.args, { onLine });
  const manifest = {
    version:'1.0',
    projectId:timeline.projectId,
    mode:'live-local',
    renderer:'ffmpeg',
    status:'RENDERED',
    output:path.relative(outDir, plan.output).split(path.sep).join('/'),
    segments:completed,
    timeline:'timeline.json',
    renderPlan:'ffmpeg-plan.json'
  };
  await writeFile(path.join(outDir, 'timeline.json'), `${JSON.stringify(timeline, null, 2)}\n`);
  await writeFile(path.join(outDir, 'composer-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (!config.keepIntermediates) await rm(plan.segmentsDir, { recursive:true, force:true });
  return manifest;
}
