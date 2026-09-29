import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_COMPOSER_CONFIG } from '../../config.js';
import { commandVersion, runCommand } from '../../process.js';

const RUNNER='CANO Render Runner V1';
const VERSION='1.0';
const MARKER='.cano-render-run.json';

async function exists(target){try{await access(target);return true}catch{return false}}
async function readJson(file){return JSON.parse(await readFile(file,'utf8'))}
async function writeJson(file,value){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n','utf8')}
async function sha256File(file){return createHash('sha256').update(await readFile(file)).digest('hex')}

function frameName(frame,total){
  const digits=Math.max(4,String(Math.max(0,total-1)).length);
  return `frame_${String(frame).padStart(digits,'0')}.png`;
}

export async function collectQaFrameManifest(framesDir,total){
  const entries=(await readdir(framesDir)).filter(name=>/^frame_\d+\.png$/.test(name)).sort();
  const expected=Array.from({length:total},(_,frame)=>frameName(frame,total));
  if(entries.length!==expected.length) throw new Error(`QA frame count mismatch: expected ${expected.length}, found ${entries.length}`);
  for(let i=0;i<expected.length;i++) if(entries[i]!==expected[i]) throw new Error(`QA frame sequence mismatch at index ${i}: expected ${expected[i]}, found ${entries[i]}`);
  const frames=[];
  const sequenceHash=createHash('sha256');
  for(const name of expected){
    const sha256=await sha256File(path.join(framesDir,name));
    frames.push({name,sha256});
    sequenceHash.update(`${name}:${sha256}\n`);
  }
  return {count:frames.length,sequenceSha256:sequenceHash.digest('hex'),frames};
}

export function buildEncodeArgs({plan,framesDir,output,crf=DEFAULT_COMPOSER_CONFIG.crf,preset=DEFAULT_COMPOSER_CONFIG.preset}){
  const pattern=path.join(framesDir,frameName(0,plan.frames).replace(/0+\.png$/, '%04d.png'));
  return [
    '-y',
    '-framerate',String(plan.fps),
    '-start_number','0',
    '-i',pattern,
    '-frames:v',String(plan.frames),
    '-vf',`scale=${plan.resolution.width}:${plan.resolution.height}:flags=lanczos`,
    '-an',
    '-c:v',DEFAULT_COMPOSER_CONFIG.videoCodec,
    '-preset',String(preset),
    '-crf',String(crf),
    '-pix_fmt','yuv420p',
    '-movflags','+faststart',
    '-map_metadata','-1',
    output
  ];
}

export function validateProbe(probe,plan){
  const video=(probe.streams??[]).find(stream=>stream.codec_type==='video');
  const audio=(probe.streams??[]).filter(stream=>stream.codec_type==='audio');
  const errors=[];
  if(!video) errors.push('video stream missing');
  if(video&&video.codec_name!=='h264') errors.push(`expected h264 codec, got ${video.codec_name}`);
  if(video&&(Number(video.width)!==Number(plan.resolution.width)||Number(video.height)!==Number(plan.resolution.height))){
    errors.push(`resolution mismatch: expected ${plan.resolution.width}x${plan.resolution.height}, got ${video.width}x${video.height}`);
  }
  const rate=String(video?.r_frame_rate??'0/1').split('/').map(Number);
  const fps=rate[1]?rate[0]/rate[1]:0;
  if(Math.abs(fps-Number(plan.fps))>0.001) errors.push(`fps mismatch: expected ${plan.fps}, got ${fps}`);
  const frames=Number(video?.nb_read_frames??video?.nb_frames);
  if(!Number.isFinite(frames)||frames!==Number(plan.frames)) errors.push(`frame count mismatch: expected ${plan.frames}, got ${video?.nb_read_frames??video?.nb_frames??'unknown'}`);
  if(audio.length) errors.push(`silent master contains ${audio.length} audio stream(s)`);
  return {ok:errors.length===0,errors,video,audioStreams:audio.length,fps,frames};
}

function probeOutput(ffprobePath,file){
  const result=spawnSync(ffprobePath,[
    '-v','error','-count_frames','-show_streams','-show_format','-of','json',file
  ],{encoding:'utf8',windowsHide:true});
  if(result.status!==0) throw new Error(`ffprobe failed: ${String(result.stderr??'').slice(-1600)}`);
  return JSON.parse(result.stdout);
}

async function guardOutput(outputDir,workspace,force){
  if(!(await exists(outputDir))) return;
  if(!force) throw new Error(`render output already exists: ${outputDir}; pass --force to rebuild`);
  const markerPath=path.join(outputDir,MARKER);
  if(!(await exists(markerPath))) throw new Error(`refusing to delete unmarked render directory: ${outputDir}`);
  const marker=await readJson(markerPath);
  if(marker.runner!==RUNNER||path.resolve(marker.workspace)!==path.resolve(workspace)){
    throw new Error(`refusing to delete render directory with mismatched marker: ${outputDir}`);
  }
  await rm(outputDir,{recursive:true,force:true});
}

async function updateState(workspace,artifacts){
  const statePath=path.join(workspace,'state.json');
  const state=await readJson(statePath);
  const next={
    ...state,
    stage:'silent-master-rendered',
    gates:{...state.gates,silentMasterReady:true,visualApproved:false,publicationMasterReady:false}
  };
  await writeJson(statePath,next);
  const renderPath=path.join(workspace,'render','render-plan.json');
  const render=await readJson(renderPath);
  await writeJson(renderPath,{...render,status:'silent-master-rendered',silentMaster:artifacts});
  return next;
}

export async function runRender(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const [plan,state,qaReport]=await Promise.all([
    readJson(path.join(workspace,'plan.json')),
    readJson(path.join(workspace,'state.json')),
    readJson(path.join(workspace,'qa','run-v1','qa-report.json'))
  ]);
  if(!state.gates?.visualQaPassed||qaReport.status!=='AUTO_PASS') throw new Error('visual QA has not passed; run cano-tutorial qa successfully first');
  if(state.gates?.visualApproved) throw new Error('visual approval already exists; Render Runner V1 must run before approval/audio');

  const framesDir=path.join(workspace,'qa','run-v1','frames');
  if(!(await exists(framesDir))) throw new Error(`QA frames missing: ${framesDir}`);
  const frameManifest=await collectQaFrameManifest(framesDir,plan.frames);

  const ffmpegPath=options.ffmpegPath||DEFAULT_COMPOSER_CONFIG.ffmpegPath;
  const ffprobePath=options.ffprobePath||DEFAULT_COMPOSER_CONFIG.ffprobePath;
  const ffmpegVersion=commandVersion(ffmpegPath);
  const ffprobeVersion=commandVersion(ffprobePath);
  if(!ffmpegVersion.ok) throw new Error(`FFmpeg unavailable: ${ffmpegPath}`);
  if(!ffprobeVersion.ok) throw new Error(`ffprobe unavailable: ${ffprobePath}`);

  const outputDir=path.join(workspace,'render','run-v1');
  await guardOutput(outputDir,workspace,Boolean(options.force));
  await mkdir(outputDir,{recursive:true});
  await writeJson(path.join(outputDir,MARKER),{runner:RUNNER,version:VERSION,workspace});

  const frameManifestPath=path.join(outputDir,'source-frame-manifest.json');
  await writeJson(frameManifestPath,{
    version:'1.0',
    projectId:plan.projectId,
    qaReport:{path:'qa/run-v1/qa-report.json',sha256:await sha256File(path.join(workspace,'qa','run-v1','qa-report.json'))},
    frameCount:frameManifest.count,
    sequenceSha256:frameManifest.sequenceSha256,
    frames:frameManifest.frames
  });

  const tempOutput=path.join(outputDir,'silent-master.tmp.mp4');
  const finalOutput=path.join(outputDir,'silent-master.mp4');
  const args=buildEncodeArgs({
    plan,framesDir,output:tempOutput,
    crf:options.crf??DEFAULT_COMPOSER_CONFIG.crf,
    preset:options.preset??DEFAULT_COMPOSER_CONFIG.preset
  });
  await writeJson(path.join(outputDir,'encode-plan.json'),{
    runner:RUNNER,
    ffmpegPath,
    args:args.map(arg=>arg===tempOutput?'silent-master.tmp.mp4':arg),
    audio:false,
    source:'qa/run-v1/frames',
    sourceSequenceSha256:frameManifest.sequenceSha256
  });

  try{
    await runCommand(ffmpegPath,args);
    const probe=probeOutput(ffprobePath,tempOutput);
    const validation=validateProbe(probe,plan);
    if(!validation.ok) throw new Error(`encoded master validation failed: ${validation.errors.join('; ')}`);
    await rename(tempOutput,finalOutput);

    const artifacts={
      master:'render/run-v1/silent-master.mp4',
      manifest:'render/run-v1/render-manifest.json',
      sourceFrames:'render/run-v1/source-frame-manifest.json',
      encodePlan:'render/run-v1/encode-plan.json'
    };
    const report={
      runner:RUNNER,
      version:VERSION,
      projectId:plan.projectId,
      mode:plan.mode,
      status:'SILENT_MASTER_READY',
      sourceFrameCount:frameManifest.count,
      sourceSequenceSha256:frameManifest.sequenceSha256,
      output:{path:artifacts.master,sha256:await sha256File(finalOutput),bytes:(await stat(finalOutput)).size},
      probe:{codec:validation.video.codec_name,width:validation.video.width,height:validation.video.height,fps:validation.fps,frames:validation.frames,audioStreams:validation.audioStreams},
      runtime:{ffmpegVersion:ffmpegVersion.output,ffprobeVersion:ffprobeVersion.output},
      visualApproved:false,
      manualVisualApprovalRequired:true,
      audio:false,
      providerCalls:0,
      externalSpend:0
    };
    await writeJson(path.join(outputDir,'render-manifest.json'),report);
    const nextState=await updateState(workspace,artifacts);
    return {workspace,outputDir,report,state:nextState};
  }catch(error){
    await rm(tempOutput,{force:true});
    throw error;
  }
}

export { RUNNER as RENDER_RUNNER, VERSION as RENDER_RUNNER_VERSION };
