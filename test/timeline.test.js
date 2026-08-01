import test from 'node:test';
import assert from 'node:assert/strict';
import { compileTimeline } from '../src/timeline.js';
import { validateComposition } from '../src/validate.js';
import { normalizeComposerConfig, validateComposerConfig } from '../src/config.js';

const input = { version:'1.1', projectId:'demo-compose', canvas:'9:16', scenes:[{id:'a',type:'avatar',asset:'a.mp4',duration:3},{id:'b',type:'browser',asset:'b.webm',duration:7}] };

test('timeline is contiguous', () => {
  const timeline = compileTimeline(input);
  assert.equal(timeline.duration, 10);
  assert.equal(timeline.scenes[1].start, 3);
  assert.equal(timeline.resolution.height, 1920);
});

test('title can be generated from text and config validates', () => {
  const result = validateComposition({ version:'1.1', projectId:'title-demo', canvas:'16:9', scenes:[{id:'title',type:'title',text:'Hola',duration:2}] });
  assert.equal(result.ok, true);
  assert.equal(validateComposerConfig(normalizeComposerConfig()).ok, true);
});
