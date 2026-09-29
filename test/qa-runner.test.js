import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePng, encodePng, meanFrameDiff, resizeNearest, composeSheet } from '../src/tutorial-engine/qa-runner/png.js';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { keyframesFromStoryboard, contactFrames, inspectGeometry } from '../src/tutorial-engine/qa-runner/runner.js';

test('PNG encode/decode roundtrip is lossless',()=>{
  const image={width:2,height:2,data:Buffer.from([
    0,0,0,255, 255,0,0,255,
    0,255,0,255, 0,0,255,255
  ])};
  const decoded=decodePng(encodePng(image));
  assert.equal(decoded.width,2);
  assert.equal(decoded.height,2);
  assert.deepEqual(decoded.data,image.data);
});

test('mean frame diff detects motion and exact holds',()=>{
  const a={width:4,height:4,data:Buffer.alloc(4*4*4,0)};
  const b={width:4,height:4,data:Buffer.alloc(4*4*4,0)};
  for(let i=3;i<a.data.length;i+=4){a.data[i]=255;b.data[i]=255}
  assert.equal(meanFrameDiff(a,b,1),0);
  b.data[0]=255;b.data[1]=255;b.data[2]=255;
  assert.ok(meanFrameDiff(a,b,1)>0);
});

test('resize and contact sheet preserve deterministic dimensions',()=>{
  const image={width:4,height:4,data:Buffer.alloc(4*4*4,255)};
  const thumb=resizeNearest(image,2,2);
  assert.equal(thumb.data.length,16);
  const sheet=composeSheet([thumb,thumb,thumb],{columns:2,padding:1});
  assert.equal(sheet.width,7);
  assert.equal(sheet.height,7);
});

test('storyboard keyframes cover starts, middles, handoffs and final frame',()=>{
  const plan={fps:24,frames:360};
  const storyboard={scenes:[
    {durationSeconds:3},{durationSeconds:4},{durationSeconds:4},{durationSeconds:4}
  ]};
  const frames=keyframesFromStoryboard(storyboard,plan);
  assert.ok(frames.includes(0));
  assert.ok(frames.includes(72));
  assert.ok(frames.includes(359));
  assert.ok(frames.length>8);
});

test('contact frame cadence is half a second plus final frame',()=>{
  const frames=contactFrames({fps:24,frames:360});
  assert.equal(frames[0],0);
  assert.equal(frames[1],12);
  assert.equal(frames.at(-1),359);
});

test('geometry audit ignores invisible items and catches readable overflow',()=>{
  const audit=[
    {id:'title',opacity:1,x:48,y:100,w:624,h:100},
    {id:'caption',opacity:1,x:10,y:1180,w:650,h:50},
    {id:'phase',opacity:0,x:-200,y:-200,w:50,h:20}
  ];
  const violations=inspectGeometry(audit,'screen_tutorial',100);
  assert.equal(violations.length,1);
  assert.equal(violations[0].id,'caption');
  assert.equal(violations[0].type,'readable-margin');
});


test('QA refuses a workspace before source is ready',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-qa-gate-'));
  try{
    await writeFile(path.join(root,'plan.json'),JSON.stringify({projectId:'qa-gate',mode:'screen_tutorial',frames:10,fps:24,qaGates:{}}));
    await writeFile(path.join(root,'storyboard.json'),JSON.stringify({scenes:[]}));
    await writeFile(path.join(root,'state.json'),JSON.stringify({gates:{sourceReady:false}}));
    const {runQa}=await import('../src/tutorial-engine/qa-runner/runner.js');
    await assert.rejects(()=>runQa(root),/project source is not ready/);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('QA driver blocks external HTTP and HTTPS requests',async()=>{
  const driver=await readFile(new URL('../scripts/tutorial_qa_driver.py',import.meta.url),'utf8');
  assert.ok(driver.includes('url.startswith((\"http://\", \"https://\"))'));
  assert.match(driver,/blockedNetworkRequests/);
});
