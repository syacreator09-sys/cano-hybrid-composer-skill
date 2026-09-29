import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { approveVisualMaster, inspectVisualApproval } from '../src/tutorial-engine/approval-gate/runner.js';

async function fixture({audioEnabled=true}={}){
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-approval-'));
  await mkdir(path.join(root,'qa','run-v1'),{recursive:true});
  await mkdir(path.join(root,'render','run-v1'),{recursive:true});
  await mkdir(path.join(root,'audio'),{recursive:true});
  const master=Buffer.from('exact-reviewed-silent-master');
  const sha=createHash('sha256').update(master).digest('hex');
  await writeFile(path.join(root,'render','run-v1','silent-master.mp4'),master);
  await writeFile(path.join(root,'plan.json'),JSON.stringify({projectId:'approval-fixture',frames:360}));
  await writeFile(path.join(root,'state.json'),JSON.stringify({
    stage:'silent-master-rendered',
    gates:{visualQaPassed:true,silentMasterReady:true,visualApproved:false,audioReady:!audioEnabled,publicationMasterReady:false}
  }));
  await writeFile(path.join(root,'qa','run-v1','qa-report.json'),JSON.stringify({status:'AUTO_PASS',metrics:{frameCount:360}}));
  await writeFile(path.join(root,'render','run-v1','render-manifest.json'),JSON.stringify({
    status:'SILENT_MASTER_READY',
    sourceSequenceSha256:'a'.repeat(64),
    output:{path:'render/run-v1/silent-master.mp4',sha256:sha,bytes:master.length}
  }));
  await writeFile(path.join(root,'render','render-plan.json'),JSON.stringify({status:'silent-master-rendered'}));
  await writeFile(path.join(root,'audio','audio-plan.json'),JSON.stringify({
    enabled:audioEnabled,
    status:audioEnabled?'blocked-until-visual-approved':'disabled'
  }));
  return {root,sha};
}

test('approval requires exact SHA-256 and named human reviewer',async()=>{
  const {root,sha}=await fixture();
  try{
    await assert.rejects(()=>approveVisualMaster(root,{reviewer:'Alfonso'}),/requires --sha256/);
    await assert.rejects(()=>approveVisualMaster(root,{expectedSha256:sha}),/requires --reviewer/);
    await assert.rejects(()=>approveVisualMaster(root,{expectedSha256:'0'.repeat(64),reviewer:'Alfonso'}),/approval SHA-256 mismatch/);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('approval records immutable master identity and advances only visual gate',async()=>{
  const {root,sha}=await fixture({audioEnabled:true});
  try{
    const result=await approveVisualMaster(root,{expectedSha256:sha,reviewer:'Alfonso',note:'Visual revisado',approvedAt:'2026-09-29T21:30:00.000Z'});
    assert.equal(result.approval.decision,'APPROVED');
    assert.equal(result.approval.master.sha256,sha);
    assert.equal(result.state.stage,'visual-approved');
    assert.equal(result.state.gates.visualApproved,true);
    assert.equal(result.state.gates.audioReady,false);
    assert.equal(result.state.gates.publicationMasterReady,false);
    assert.equal(result.audioPlan.status,'ready-for-audio-production');
    assert.equal(result.approval.providerCalls,0);
    assert.equal(result.approval.externalSpend,0);
    const inspected=await inspectVisualApproval(root);
    assert.equal(inspected.approved,true);
    assert.equal(inspected.approval.reviewer,'Alfonso');
  }finally{await rm(root,{recursive:true,force:true})}
});

test('approval leaves audioReady true only when audio is disabled',async()=>{
  const {root,sha}=await fixture({audioEnabled:false});
  try{
    const result=await approveVisualMaster(root,{expectedSha256:sha,reviewer:'Human Reviewer',approvedAt:'2026-09-29T21:30:00.000Z'});
    assert.equal(result.state.gates.audioReady,true);
    assert.equal(result.audioPlan.status,'disabled');
    assert.equal(result.state.gates.visualApproved,true);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('approval detects a master changed after render manifest creation',async()=>{
  const {root,sha}=await fixture();
  try{
    await writeFile(path.join(root,'render','run-v1','silent-master.mp4'),'tampered');
    await assert.rejects(()=>approveVisualMaster(root,{expectedSha256:sha,reviewer:'Alfonso'}),/hash no longer matches render manifest/);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('visual approval is idempotent for the same human decision and immutable for a different one',async()=>{
  const {root,sha}=await fixture();
  try{
    const first=await approveVisualMaster(root,{expectedSha256:sha,reviewer:'Alfonso',note:'ok',approvedAt:'2026-09-29T21:30:00.000Z'});
    const repeated=await approveVisualMaster(root,{expectedSha256:sha,reviewer:'Alfonso',note:'ok',approvedAt:'2026-09-30T00:00:00.000Z'});
    assert.equal(repeated.approval.approvedAt,first.approval.approvedAt);
    await assert.rejects(()=>approveVisualMaster(root,{expectedSha256:sha,reviewer:'Another Reviewer'}),/visual approval already recorded/);
  }finally{await rm(root,{recursive:true,force:true})}
});
