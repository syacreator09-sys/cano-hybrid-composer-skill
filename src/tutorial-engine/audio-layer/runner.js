import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { access, copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_COMPOSER_CONFIG } from '../../config.js';
import { commandVersion, runCommand } from '../../process.js';

const RUNNER='CANO Audio Layer V1';
const VERSION='1.0';
const MARKER='.cano-audio-run.json';
const ALLOWED_EXTENSIONS=new Set(['.mp3','.wav','.m4a','.aac','.flac','.ogg','.opus']);

async function exists(target){try{await access(target);return true}catch{return false}}
async function readJson(file){return JSON.parse(await readFile(file,'utf8'))}
async function writeJson(file,value){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n','utf8')}
async function sha256File(file){return createHash('sha256').update(await readFile(file)).digest('hex')}

function normalizeVolume(value,fallback){
  const number=Number(value);
  if(!Number.isFinite(number)||number<0||number>4) return fallback;
  return number;
}

function resolveInside(workspace,relative){
  const resolved=path.resolve(workspace,relative);
  const prefix=workspace.endsWith(path.sep)?workspace:workspace+path.sep;
  if(resolved!==workspace&&!resolved.startsWith(prefix)) throw new Error(`path escapes workspace: ${relative}`);
  return resolved;
}

function defaultProbeAsset(file,ffprobePath){
  const result=spawnSync(ffprobePath,['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',windowsHide:true});
  if(result.status!==0) throw new Error(`ffprobe failed for ${path.basename(file)}: ${String(result.stderr??'').slice(-1200)}`);
  return JSON.parse(result.stdout);
}

function validateAudioProbe(probe,label){
  const audio=(probe.streams??[]).find(stream=>stream.codec_type==='audio');
  if(!audio) throw new Error(`${label} does not contain an audio stream`);
  const duration=Number(audio.duration??probe.format?.duration);
  if(!Number.isFinite(duration)||duration<=0) throw new Error(`${label} duration is invalid`);
  return {
    codec:audio.codec_name??null,
    sampleRate:Number(audio.sample_rate)||null,
    channels:Number(audio.channels)||null,
    durationSeconds:duration
  };
}

async function guardRunDir(runDir,workspace,force){
  if(!(await exists(runDir))) return;
  if(!force) throw new Error(`audio output already exists: ${runDir}; pass --force to rebuild`);
  const markerPath=path.join(runDir,MARKER);
  if(!(await exists(markerPath))) throw new Error(`refusing to delete unmarked audio directory: ${runDir}`);
  const marker=await readJson(markerPath);
  if(marker.runner!==RUNNER||path.resolve(marker.workspace)!==path.resolve(workspace)){
    throw new Error(`refusing to delete audio directory with mismatched marker: ${runDir}`);
  }
  await rm(runDir,{recursive:true,force:true});
}

function normalizeAssetInput(label,file){
  if(!file) return null;
  const absolute=path.resolve(file);
  const ext=path.extname(absolute).toLowerCase();
  if(!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`${label} extension is unsupported: ${ext||'(none)'}`);
  return {label,absolute,ext};
}

async function verifyApproval(workspace){
  const [plan,state,audioPlan,approval,renderManifest]=await Promise.all([
    readJson(path.join(workspace,'plan.json')),
    readJson(path.join(workspace,'state.json')),
    readJson(path.join(workspace,'audio','audio-plan.json')),
    readJson(path.join(workspace,'approval','visual-approval.json')),
    readJson(path.join(workspace,'render','run-v1','render-manifest.json'))
  ]);
  if(!audioPlan.enabled) throw new Error('audio is disabled for this project');
  if(!state.gates?.visualApproved||approval.decision!=='APPROVED') throw new Error('visual master is not approved; audio production is blocked');
  if(audioPlan.status!=='ready-for-audio-production'&&audioPlan.status!=='assets-ready'){
    throw new Error(`audio plan is not ready: ${audioPlan.status}`);
  }
  const silentRel=renderManifest.output?.path;
  if(!silentRel) throw new Error('render manifest does not identify the silent master');
  const silentMaster=resolveInside(workspace,silentRel);
  if(!(await exists(silentMaster))) throw new Error(`silent master missing: ${silentRel}`);
  const currentSha=await sha256File(silentMaster);
  if(currentSha!==renderManifest.output?.sha256||currentSha!==approval.master?.sha256){
    throw new Error('silent master identity no longer matches render/approval records');
  }
  return {plan,state,audioPlan,approval,renderManifest,silentMaster};
}

export async function registerAudioAssets(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const verified=await verifyApproval(workspace);
  const voice=normalizeAssetInput('voice',options.voice);
  if(!voice) throw new Error('audio registration requires --voice');
  const music=normalizeAssetInput('music',options.music);
  const sfx=normalizeAssetInput('sfx',options.sfx);

  for(const item of [voice,music,sfx].filter(Boolean)){
    if(!(await exists(item.absolute))) throw new Error(`${item.label} file missing: ${item.absolute}`);
  }

  const ffprobePath=options.ffprobePath||DEFAULT_COMPOSER_CONFIG.ffprobePath;
  const ffprobeVersion=commandVersion(ffprobePath);
  if(!ffprobeVersion.ok&&!options.probeAsset) throw new Error(`ffprobe unavailable: ${ffprobePath}`);
  const probeAsset=options.probeAsset??((file)=>defaultProbeAsset(file,ffprobePath));

  const runDir=path.join(workspace,'audio','run-v1');
  await guardRunDir(runDir,workspace,Boolean(options.force));
  await mkdir(path.join(runDir,'assets'),{recursive:true});
  await writeJson(path.join(runDir,MARKER),{runner:RUNNER,version:VERSION,workspace});

  const entries=[];
  for(const item of [voice,music,sfx].filter(Boolean)){
    const destRel=path.join('audio','run-v1','assets',`${item.label}${item.ext}`).split(path.sep).join('/');
    const dest=resolveInside(workspace,destRel);
    await copyFile(item.absolute,dest);
    const probe=validateAudioProbe(await probeAsset(dest),item.label);
    entries.push({
      id:item.label,
      path:destRel,
      sha256:await sha256File(dest),
      bytes:(await stat(dest)).size,
      probe
    });
  }

  const manifest={
    runner:RUNNER,
    version:VERSION,
    projectId:verified.plan.projectId,
    status:'AUDIO_ASSETS_READY',
    visualApproval:'approval/visual-approval.json',
    silentMaster:{path:verified.renderManifest.output.path,sha256:verified.renderManifest.output.sha256},
    assets:entries,
    providerBoundary:{
      generatedExternally:true,
      expectedProvider:'ElevenLabs',
      providerCallsByRepository:0,
      externalSpendByRepository:0
    }
  };
  await writeJson(path.join(runDir,'audio-assets-manifest.json'),manifest);

  const nextAudioPlan={
    ...verified.audioPlan,
    status:'assets-ready',
    assetsManifest:'audio/run-v1/audio-assets-manifest.json',
    assets:entries.map(item=>({id:item.id,path:item.path,sha256:item.sha256}))
  };
  await writeJson(path.join(workspace,'audio','audio-plan.json'),nextAudioPlan);

  const nextState={
    ...verified.state,
    stage:'audio-assets-ready',
    gates:{...verified.state.gates,audioReady:true,publicationMasterReady:false},
    audioAssets:'audio/run-v1/audio-assets-manifest.json'
  };
  await writeJson(path.join(workspace,'state.json'),nextState);

  return {workspace,runDir,manifest,state:nextState,audioPlan:nextAudioPlan};
}

export function buildMixArgs({silentMaster,assets,output,durationSeconds,voiceVolume=1,musicVolume=.12,sfxVolume=.65}){
  const ordered=['voice','sfx','music'].map(id=>assets.find(item=>item.id===id)).filter(Boolean);
  if(!ordered.some(item=>item.id==='voice')) throw new Error('voice asset is required for publication mix');

  const args=['-y','-i',silentMaster];
  for(const item of ordered) args.push('-i',item.absolute);

  const filters=[];
  const labels=[];
  ordered.forEach((item,index)=>{
    const inputIndex=index+1;
    const volume=item.id==='voice'?voiceVolume:item.id==='music'?musicVolume:sfxVolume;
    const label=`a${index}`;
    filters.push(`[${inputIndex}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${volume},apad[${label}]`);
    labels.push(`[${label}]`);
  });
  filters.push(`${labels.join('')}amix=inputs=${labels.length}:duration=longest:dropout_transition=0,atrim=0:${Number(durationSeconds).toFixed(3)},asetpts=N/SR/TB[aout]`);

  args.push(
    '-filter_complex',filters.join(';'),
    '-map','0:v:0',
    '-map','[aout]',
    '-c:v','copy',
    '-c:a','aac',
    '-b:a','192k',
    '-ar','48000',
    '-ac','2',
    '-movflags','+faststart',
    '-map_metadata','-1',
    '-shortest',
    output
  );
  return args;
}

export function validatePublicationProbe(probe,plan){
  const video=(probe.streams??[]).find(stream=>stream.codec_type==='video');
  const audios=(probe.streams??[]).filter(stream=>stream.codec_type==='audio');
  const errors=[];
  if(!video) errors.push('video stream missing');
  if(video&&video.codec_name!=='h264') errors.push(`expected h264 codec, got ${video.codec_name}`);
  if(video&&(Number(video.width)!==Number(plan.resolution.width)||Number(video.height)!==Number(plan.resolution.height))){
    errors.push(`resolution mismatch: expected ${plan.resolution.width}x${plan.resolution.height}, got ${video.width}x${video.height}`);
  }
  const rate=String(video?.r_frame_rate??'0/1').split('/').map(Number);
  const fps=rate[1]?rate[0]/rate[1]:0;
  if(Math.abs(fps-Number(plan.fps))>.001) errors.push(`fps mismatch: expected ${plan.fps}, got ${fps}`);
  const frames=Number(video?.nb_read_frames??video?.nb_frames);
  if(Number.isFinite(frames)&&frames!==Number(plan.frames)) errors.push(`frame count mismatch: expected ${plan.frames}, got ${frames}`);
  if(audios.length!==1) errors.push(`expected exactly 1 audio stream, got ${audios.length}`);
  if(audios[0]&&audios[0].codec_name!=='aac') errors.push(`expected aac audio, got ${audios[0].codec_name}`);
  return {ok:errors.length===0,errors,video,audio:audios[0]??null,fps,frames};
}

function probePublication(ffprobePath,file){
  const result=spawnSync(ffprobePath,['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{encoding:'utf8',windowsHide:true});
  if(result.status!==0) throw new Error(`ffprobe failed: ${String(result.stderr??'').slice(-1600)}`);
  return JSON.parse(result.stdout);
}

export async function mixPublicationMaster(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const verified=await verifyApproval(workspace);
  if(!verified.state.gates?.audioReady) throw new Error('audio assets are not ready; run audio-register first');
  if(verified.state.gates?.publicationMasterReady) throw new Error('publication master already exists');

  const assetsManifest=await readJson(path.join(workspace,'audio','run-v1','audio-assets-manifest.json'));
  if(assetsManifest.status!=='AUDIO_ASSETS_READY') throw new Error('audio asset manifest is not ready');

  const assets=[];
  for(const item of assetsManifest.assets??[]){
    const absolute=resolveInside(workspace,item.path);
    if(!(await exists(absolute))) throw new Error(`registered audio asset missing: ${item.path}`);
    const sha=await sha256File(absolute);
    if(sha!==item.sha256) throw new Error(`registered audio asset hash mismatch: ${item.id}`);
    assets.push({...item,absolute});
  }
  if(!assets.some(item=>item.id==='voice')) throw new Error('registered voice asset is required');

  const ffmpegPath=options.ffmpegPath||DEFAULT_COMPOSER_CONFIG.ffmpegPath;
  const ffprobePath=options.ffprobePath||DEFAULT_COMPOSER_CONFIG.ffprobePath;
  const ffmpegVersion=commandVersion(ffmpegPath);
  const ffprobeVersion=commandVersion(ffprobePath);
  if(!ffmpegVersion.ok) throw new Error(`FFmpeg unavailable: ${ffmpegPath}`);
  if(!ffprobeVersion.ok) throw new Error(`ffprobe unavailable: ${ffprobePath}`);

  const runDir=path.join(workspace,'audio','run-v1');
  const output=path.join(runDir,'publication-master.mp4');
  const temp=path.join(runDir,'publication-master.tmp.mp4');
  if(await exists(output)){
    if(!options.force) throw new Error(`publication master already exists: ${output}; pass --force to rebuild`);
    await rm(output,{force:true});
  }

  const levels={
    voice:normalizeVolume(options.voiceVolume,1),
    music:normalizeVolume(options.musicVolume,.12),
    sfx:normalizeVolume(options.sfxVolume,.65)
  };
  const args=buildMixArgs({
    silentMaster:verified.silentMaster,
    assets,
    output:temp,
    durationSeconds:verified.plan.durationSeconds,
    voiceVolume:levels.voice,
    musicVolume:levels.music,
    sfxVolume:levels.sfx
  });

  await writeJson(path.join(runDir,'mix-plan.json'),{
    runner:RUNNER,
    version:VERSION,
    silentMaster:verified.renderManifest.output,
    audioAssets:assets.map(({absolute,...item})=>item),
    levels,
    ffmpegPath,
    args:args.map(value=>value===verified.silentMaster?verified.renderManifest.output.path:value===temp?'audio/run-v1/publication-master.tmp.mp4':value)
  });

  try{
    await runCommand(ffmpegPath,args);
    const probe=probePublication(ffprobePath,temp);
    const validation=validatePublicationProbe(probe,verified.plan);
    if(!validation.ok) throw new Error(`publication master validation failed: ${validation.errors.join('; ')}`);
    await copyFile(temp,output);
    await rm(temp,{force:true});

    const report={
      runner:RUNNER,
      version:VERSION,
      projectId:verified.plan.projectId,
      status:'PUBLICATION_MASTER_READY',
      visualApproval:'approval/visual-approval.json',
      silentMaster:{path:verified.renderManifest.output.path,sha256:verified.renderManifest.output.sha256},
      audioAssets:assets.map(({absolute,...item})=>item),
      levels,
      output:{path:'audio/run-v1/publication-master.mp4',sha256:await sha256File(output),bytes:(await stat(output)).size},
      probe:{codec:validation.video?.codec_name??null,width:validation.video?.width??null,height:validation.video?.height??null,fps:validation.fps,frames:validation.frames,audioCodec:validation.audio?.codec_name??null},
      runtime:{ffmpegVersion:ffmpegVersion.output,ffprobeVersion:ffprobeVersion.output},
      providerCallsByRepository:0,
      externalSpendByRepository:0
    };
    await writeJson(path.join(runDir,'publication-manifest.json'),report);

    const nextState={
      ...verified.state,
      stage:'publication-master-ready',
      gates:{...verified.state.gates,audioReady:true,publicationMasterReady:true},
      publicationMaster:'audio/run-v1/publication-master.mp4'
    };
    await writeJson(path.join(workspace,'state.json'),nextState);

    const nextAudioPlan={
      ...verified.audioPlan,
      status:'publication-master-ready',
      publicationMaster:'audio/run-v1/publication-master.mp4',
      publicationManifest:'audio/run-v1/publication-manifest.json'
    };
    await writeJson(path.join(workspace,'audio','audio-plan.json'),nextAudioPlan);

    return {workspace,runDir,report,state:nextState,audioPlan:nextAudioPlan};
  }catch(error){
    await rm(temp,{force:true});
    throw error;
  }
}

export async function inspectAudioLayer(workspaceDir){
  const workspace=path.resolve(workspaceDir);
  const state=await readJson(path.join(workspace,'state.json'));
  const audioPlan=await readJson(path.join(workspace,'audio','audio-plan.json'));
  const assetsPath=path.join(workspace,'audio','run-v1','audio-assets-manifest.json');
  const publicationPath=path.join(workspace,'audio','run-v1','publication-manifest.json');
  return {
    workspace,
    state,
    audioPlan,
    assetsManifest:(await exists(assetsPath))?await readJson(assetsPath):null,
    publicationManifest:(await exists(publicationPath))?await readJson(publicationPath):null
  };
}

export { RUNNER as AUDIO_LAYER, VERSION as AUDIO_LAYER_VERSION };
