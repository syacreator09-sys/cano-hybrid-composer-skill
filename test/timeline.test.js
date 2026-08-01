import test from'node:test';import assert from'node:assert/strict';import{compileTimeline}from'../src/timeline.js';
const input={version:'1.0',projectId:'demo-compose',canvas:'9:16',scenes:[{id:'a',type:'avatar',asset:'a.mp4',duration:3},{id:'b',type:'browser',asset:'b.webm',duration:7}]};
test('timeline is contiguous',()=>{const t=compileTimeline(input);assert.equal(t.duration,10);assert.equal(t.scenes[1].start,3);assert.equal(t.resolution.height,1920);});
