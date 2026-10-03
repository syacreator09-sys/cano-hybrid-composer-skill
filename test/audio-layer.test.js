import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildMixArgs, registerAudioAssets, validatePublicationProbe } from '../src/tutorial-engine/audio-layer/runner.js';

async function fixture(){
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-audio-'));
  await mkdir(path.join(root,'audio'),{recursive:true});
  await mkdir(path.join(root,'approval'),{recursive:true});
  await mkdir(path.join(root,'render','run-v1'),{recursive:true});
  const silent=Buffer.from('silent-master');
  const {createHash}=await import('node:crypto');
  const sha=createHash('sha256').update(silent).digest('hex');
  await writeFile(path.join(root,'render','run-v1','silent-master.mp4'),silent);
  await writeFile(path.join(root,'plan.json'),JSON.stringify({projectId:'audio-fixture',durationSeconds:15,fps:24,frames:360,resolution:{width:1080,height:1920}}));
  await writeFile(path.join(root,'state.json'),JSON.stringify({stage:'visual-approved',gates:{visualApproved:true,audioReady:false,publicationMasterReady:false}}));
  await writeFile(path.join(root,'audio','audio-plan.json'),JSON.stringify({enabled:true,status:'ready-for-audio-production',preferredProvider:'ElevenLabs'}));
  await writeFile(path.join(root,'approval','visual-approval.json'),JSON.stringify({decision:'APPROVED',master:{sha256:sha}}));
  await writeFile(path.join(root,'render','run-v1','render-manifest.json'),JSON.stringify({status:'SILENT_MASTER_READY',output:{path:'render/run-v1/silent-master.mp4',sha256:sha}}));
  return {root};
}

test('mix args preserve approved video stream and create AAC audio',()=>{
  const args=buildMixArgs({
    silentMaster:'/tmp/silent.mp4',
    assets:[
      {id:'voice',absolute:'/tmp/voice.mp3'},
      {id:'sfx',absolute:'/tmp/sfx.wav'},
      {id:'music',absolute:'/tmp/music.mp3'}
    ],
    output:'/tmp/out.mp4',
    durationSeconds:15
  });
  assert.ok(args.includes('copy'));
  assert.ok(args.includes('aac'));
  assert.ok(args.includes('-filter_complex'));
  assert.ok(args.includes('[aout]'));
  assert.ok(args.some(value=>String(value).includes('amix=inputs=3')));
});

test('publication probe enforces h264 plus one AAC stream',()=>{
  const plan={fps:24,frames:360,resolution:{width:1080,height:1920}};
  const probe={streams:[
    {codec_type:'video',codec_name:'h264',width:1080,height:1920,r_frame_rate:'24/1',nb_read_frames:'360'},
    {codec_type:'audio',codec_name:'aac'}
  ]};
  assert.equal(validatePublicationProbe(probe,plan).ok,true);
  const bad={streams:[probe.streams[0]]};
  assert.equal(validatePublicationProbe(bad,plan).ok,false);
});

test('audio registration requires explicit visual approval and creates hashed asset manifest',async()=>{
  const {root}=await fixture();
  const voice=path.join(root,'voice.mp3');
  await writeFile(voice,'fake-audio');
  try{
    const result=await registerAudioAssets(root,{
      voice,
      probeAsset:async()=>({streams:[{codec_type:'audio',codec_name:'mp3',sample_rate:'44100',channels:2,duration:'12.5'}],format:{duration:'12.5'}})
    });
    assert.equal(result.manifest.status,'AUDIO_ASSETS_READY');
    assert.equal(result.state.gates.audioReady,true);
    const saved=JSON.parse(await readFile(path.join(root,'audio','run-v1','audio-assets-manifest.json'),'utf8'));
    assert.equal(saved.assets[0].id,'voice');
    assert.equal(saved.assets[0].sha256.length,64);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('audio registration refuses workspaces without visual approval',async()=>{
  const {root}=await fixture();
  const voice=path.join(root,'voice.mp3');
  await writeFile(voice,'fake-audio');
  try{
    const statePath=path.join(root,'state.json');
    const state=JSON.parse(await readFile(statePath,'utf8'));
    state.gates.visualApproved=false;
    await writeFile(statePath,JSON.stringify(state));
    await assert.rejects(
      ()=>registerAudioAssets(root,{voice,probeAsset:async()=>({streams:[{codec_type:'audio',duration:'1'}],format:{duration:'1'}})}),
      /visual master is not approved/
    );
  }finally{await rm(root,{recursive:true,force:true})}
});
