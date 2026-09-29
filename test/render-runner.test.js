import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildEncodeArgs, collectQaFrameManifest, runRender, validateProbe } from '../src/tutorial-engine/render-runner/runner.js';

test('frame manifest requires a complete contiguous QA sequence',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-render-frames-'));
  try{
    await writeFile(path.join(root,'frame_0000.png'),'a');
    await writeFile(path.join(root,'frame_0001.png'),'b');
    const manifest=await collectQaFrameManifest(root,2);
    assert.equal(manifest.count,2);
    assert.equal(manifest.frames.length,2);
    assert.equal(manifest.sequenceSha256.length,64);
    await rm(path.join(root,'frame_0001.png'));
    await assert.rejects(()=>collectQaFrameManifest(root,2),/frame count mismatch/);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('encode plan uses QA PNG sequence and explicitly disables audio',()=>{
  const plan={fps:24,frames:360,resolution:{width:1080,height:1920}};
  const args=buildEncodeArgs({plan,framesDir:'/tmp/frames',output:'/tmp/master.mp4'});
  assert.ok(args.includes('-an'));
  assert.ok(args.includes('libx264'));
  assert.ok(args.includes('scale=1080:1920:flags=lanczos'));
  assert.ok(args.includes('360'));
  assert.ok(args.some(item=>String(item).includes('frame_%04d.png')));
});

test('probe validation enforces codec resolution fps frame count and silence',()=>{
  const plan={fps:24,frames:360,resolution:{width:1080,height:1920}};
  const probe={streams:[{codec_type:'video',codec_name:'h264',width:1080,height:1920,r_frame_rate:'24/1',nb_read_frames:'360'}]};
  assert.equal(validateProbe(probe,plan).ok,true);
  const bad={streams:[...probe.streams,{codec_type:'audio',codec_name:'aac'}]};
  const result=validateProbe(bad,plan);
  assert.equal(result.ok,false);
  assert.match(result.errors.join(' '),/audio stream/);
});

test('Render Runner refuses workspaces before visual QA passes',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-render-gate-'));
  try{
    await mkdir(path.join(root,'qa','run-v1'),{recursive:true});
    await writeFile(path.join(root,'plan.json'),JSON.stringify({projectId:'gate',mode:'screen_tutorial',frames:1,fps:24,resolution:{width:1080,height:1920}}));
    await writeFile(path.join(root,'state.json'),JSON.stringify({gates:{visualQaPassed:false,visualApproved:false}}));
    await writeFile(path.join(root,'qa','run-v1','qa-report.json'),JSON.stringify({status:'FAIL'}));
    await assert.rejects(()=>runRender(root),/visual QA has not passed/);
  }finally{await rm(root,{recursive:true,force:true})}
});
