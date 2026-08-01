import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFfmpegPlan, buildSceneCommand } from '../src/ffmpeg-plan.js';
import { normalizeComposerConfig } from '../src/config.js';

const config = normalizeComposerConfig();
const timeline = { projectId:'demo', canvas:'9:16', resolution:{width:1080,height:1920}, fps:30, scenes:[{id:'screen',type:'browser',asset:'screen.webm',duration:4,fit:'contain'}] };

test('video without audio receives a silent track', () => {
  const [command, args] = buildSceneCommand(timeline.scenes[0], {absolute:'/tmp/screen.webm',hasAudio:false}, timeline, config, '/tmp/out.mp4');
  assert.equal(command, 'ffmpeg');
  assert.ok(args.includes('anullsrc=r=48000:cl=stereo'));
  assert.ok(args.includes('pad=1080:1920:(ow-iw)/2:(oh-ih)/2:#111111'));
});

test('concat plan is deterministic', () => {
  const plan = buildFfmpegPlan(timeline, [{sceneId:'screen',absolute:'/tmp/screen.webm',hasAudio:true}], config, '/tmp/job');
  assert.equal(plan.segmentCommands.length, 1);
  assert.match(plan.concatContent, /001-screen\.mp4/);
  assert.match(plan.output, /demo-9x16\.mp4$/);
});
