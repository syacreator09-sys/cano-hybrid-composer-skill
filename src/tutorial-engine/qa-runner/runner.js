import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findChromiumExecutable, chromiumUserDataDir, platformLabel } from './chromium.js';
import { composeSheet, fileSha256, meanFrameDiff, readPng, resizeNearest, writePng } from './png.js';

const RUNNER='CANO QA Runner V1';
const VERSION='1.0';
const MARKER='.cano-qa-run.json';
const STAGE={width:720,height:1280};
const HARD_JUMP_THRESHOLD=8;

async function exists(target){try{await access(target);return true}catch{return false}}
async function readJson(file){return JSON.parse(await readFile(file,'utf8'))}
async function writeJson(file,value){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n','utf8')}

function frameName(frame,total){
  const digits=Math.max(4,String(Math.max(0,total-1)).length);
  return `frame_${String(frame).padStart(digits,'0')}.png`;
}

function bootstrapHtml(html){
  const bootstrap=`
<script id="cano-qa-bootstrap">
(()=>{
  const p=new URLSearchParams(location.search);
  const frame=Number(p.get('frame')||0);
  if(typeof window.renderAt!=='function') throw new Error('window.renderAt(frame) unavailable');
  window.renderAt(frame);
  document.documentElement.dataset.canoQaFrame=String(frame);
  if(p.get('audit')==='1'){
    const payload=typeof window.audit==='function'?window.audit():{error:'window.audit() unavailable'};
    const pre=document.createElement('pre');
    pre.id='canoQaAudit';
    pre.dataset.payload=btoa(JSON.stringify(payload));
    pre.style.display='none';
    document.body.appendChild(pre);
  }
})();
</script>`;
  const index=html.lastIndexOf('</body>');
  if(index<0) throw new Error('project HTML missing </body>');
  return html.slice(0,index)+bootstrap+html.slice(index);
}

function chromiumArgs({profileDir,url,screenshot=null,dumpDom=false,noSandbox=false}){
  const args=[
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=180',
    `--window-size=${STAGE.width},${STAGE.height}`,
    `--user-data-dir=${profileDir}`
  ];
  if(noSandbox) args.push('--no-sandbox');
  if(screenshot) args.push(`--screenshot=${screenshot}`);
  if(dumpDom) args.push('--dump-dom');
  args.push(url);
  return args;
}

function runProcess(command,args,{timeoutMs=30000}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    child.stdout.on('data',d=>{stdout+=d});
    child.stderr.on('data',d=>{stderr+=d});
    const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error(`Chromium timeout after ${timeoutMs}ms`))},timeoutMs);
    child.on('error',error=>{clearTimeout(timer);reject(error)});
    child.on('close',code=>{
      clearTimeout(timer);
      if(code===0) resolve({stdout,stderr});
      else reject(new Error(`Chromium exited with code ${code}: ${stderr.slice(-1200)}`));
    });
  });
}

async function guardOutput(outputDir,workspace,force){
  if(!(await exists(outputDir))) return;
  if(!force) throw new Error(`QA output already exists: ${outputDir}; pass --force to rebuild`);
  const markerPath=path.join(outputDir,MARKER);
  if(!(await exists(markerPath))) throw new Error(`refusing to delete unmarked QA directory: ${outputDir}`);
  const marker=await readJson(markerPath);
  if(marker.runner!==RUNNER||path.resolve(marker.workspace)!==path.resolve(workspace)){
    throw new Error(`refusing to delete QA directory with mismatched marker: ${outputDir}`);
  }
  await rm(outputDir,{recursive:true,force:true});
}

function keyframesFromStoryboard(storyboard,plan){
  const set=new Set([0,Math.max(0,plan.frames-1)]);
  let cursor=0;
  for(const scene of storyboard.scenes??[]){
    const start=Math.round(cursor*plan.fps);
    const middle=Math.round((cursor+Number(scene.durationSeconds||0)/2)*plan.fps);
    cursor+=Number(scene.durationSeconds||0);
    const end=Math.min(plan.frames-1,Math.round(cursor*plan.fps));
    for(const frame of [start-1,start,start+1,middle,end-1,end,end+1]){
      if(frame>=0&&frame<plan.frames)set.add(frame);
    }
  }
  return [...set].sort((a,b)=>a-b);
}

function contactFrames(plan){
  const step=Math.max(1,Math.round(plan.fps*.5));
  const frames=[];
  for(let f=0;f<plan.frames;f+=step) frames.push(f);
  if(frames.at(-1)!==plan.frames-1) frames.push(plan.frames-1);
  return frames;
}

function criticalIds(mode){
  if(mode==='screen_tutorial') return new Set(['kicker','title','sub','phase','caption']);
  if(mode==='workflow') return new Set(['phase','flow','extract','result','caption']);
  return new Set(['kicker','title','sub','phase','caption','confirm']);
}

function inspectGeometry(audit,mode,frame){
  if(!Array.isArray(audit)) return [{frame,id:'audit',type:'audit-unavailable'}];
  const ids=criticalIds(mode),violations=[];
  for(const item of audit){
    if(!ids.has(item.id)||Number(item.opacity)<=.05) continue;
    const x=Number(item.x),y=Number(item.y),w=Number(item.w),h=Number(item.h);
    if(![x,y,w,h].every(Number.isFinite)){
      violations.push({frame,id:item.id,type:'invalid-geometry'});continue;
    }
    if(x<0||y<0||x+w>STAGE.width||y+h>STAGE.height){
      violations.push({frame,id:item.id,type:'stage-overflow',x,y,w,h});
    }
    if(['kicker','title','sub','phase','caption'].includes(item.id)){
      const margin=32;
      if(x<margin||x+w>STAGE.width-margin||y<margin||y+h>STAGE.height-margin){
        violations.push({frame,id:item.id,type:'readable-margin',x,y,w,h,margin});
      }
    }
  }
  return violations;
}

async function renderOne({chromium,htmlUrl,framesDir,profilesDir,frame,total,worker,noSandbox}){
  const url=new URL(htmlUrl);url.searchParams.set('frame',String(frame));
  const file=path.join(framesDir,frameName(frame,total));
  await mkdir(path.dirname(file),{recursive:true});
  await mkdir(chromiumUserDataDir(profilesDir,worker),{recursive:true});
  await runProcess(chromium,chromiumArgs({
    profileDir:chromiumUserDataDir(profilesDir,worker),
    url:url.href,
    screenshot:file,
    noSandbox
  }));
  if(!(await exists(file))) throw new Error(`Chromium did not create frame ${frame}`);
  return file;
}

async function renderAllFrames(context){
  let next=0;
  const workers=Array.from({length:context.workers},(_,worker)=>(async()=>{
    while(true){
      const frame=next++;
      if(frame>=context.plan.frames)return;
      await renderOne({...context,frame,worker,total:context.plan.frames});
    }
  })());
  await Promise.all(workers);
}

async function auditFrame({chromium,htmlUrl,profilesDir,frame,worker,noSandbox}){
  const url=new URL(htmlUrl);url.searchParams.set('frame',String(frame));url.searchParams.set('audit','1');
  await mkdir(chromiumUserDataDir(profilesDir,worker),{recursive:true});
  const result=await runProcess(chromium,chromiumArgs({
    profileDir:chromiumUserDataDir(profilesDir,worker),
    url:url.href,
    dumpDom:true,
    noSandbox
  }));
  const match=result.stdout.match(/<pre id="canoQaAudit" data-payload="([^"]+)"/);
  if(!match) return {error:'audit payload missing'};
  return JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
}

async function calculateMetrics(framesDir,plan){
  const diffs=[],hashes=[];
  let previous=null;
  for(let frame=0;frame<plan.frames;frame++){
    const file=path.join(framesDir,frameName(frame,plan.frames));
    const image=await readPng(file);
    if(image.width!==STAGE.width||image.height!==STAGE.height){
      throw new Error(`unexpected frame dimensions at ${frame}: ${image.width}x${image.height}`);
    }
    hashes.push(await fileSha256(file));
    if(previous){
      diffs.push({a:frame-1,b:frame,diff:meanFrameDiff(previous,image,4)});
    }
    previous=image;
  }
  const exactAdjacentDuplicates=[];
  for(let i=1;i<hashes.length;i++) if(hashes[i]===hashes[i-1]) exactAdjacentDuplicates.push([i-1,i]);

  const ordered=[...diffs].sort((a,b)=>b.diff-a.diff);
  const min=[...diffs].sort((a,b)=>a.diff-b.diff)[0]??null;
  const max=ordered[0]??null;
  return {
    frameCount:plan.frames,
    exactAdjacentDuplicates,
    lowMotionPairsLt018:diffs.filter(item=>item.diff<.18).length,
    veryLowMotionPairsLt008:diffs.filter(item=>item.diff<.08).length,
    meanFrameDiff:diffs.length?diffs.reduce((sum,item)=>sum+item.diff,0)/diffs.length:0,
    minDiff:min,
    maxDiff:max,
    hardJumps:diffs.filter(item=>item.diff>HARD_JUMP_THRESHOLD),
    topTransitions:ordered.slice(0,12)
  };
}

async function buildSheet(framesDir,plan,frames,outFile,columns){
  const thumbs=[];
  for(const frame of frames){
    const image=await readPng(path.join(framesDir,frameName(frame,plan.frames)));
    thumbs.push(resizeNearest(image,180,320));
  }
  await writePng(outFile,composeSheet(thumbs,{columns,padding:4}));
}

async function updateState(workspace,passed,artifacts){
  const statePath=path.join(workspace,'state.json');
  const state=await readJson(statePath);
  const next={
    ...state,
    stage:passed?'qa-auto-passed':'qa-failed',
    gates:{...state.gates,visualRendered:true,visualQaPassed:passed,visualApproved:false}
  };
  await writeJson(statePath,next);

  const renderPath=path.join(workspace,'render','render-plan.json');
  const render=await readJson(renderPath);
  await writeJson(renderPath,{
    ...render,
    status:passed?'qa-auto-passed':'qa-failed',
    qaArtifacts:artifacts
  });

  const qaPlanPath=path.join(workspace,'qa','qa-plan.json');
  const qaPlan=await readJson(qaPlanPath);
  await writeJson(qaPlanPath,{...qaPlan,status:passed?'auto-passed':'failed',manualVisualApprovalRequired:true});
  return next;
}

export async function runQa(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const plan=await readJson(path.join(workspace,'plan.json'));
  const storyboard=await readJson(path.join(workspace,'storyboard.json'));
  const state=await readJson(path.join(workspace,'state.json'));
  if(!state.gates?.sourceReady) throw new Error('project source is not ready; run cano-tutorial source first');

  const source=path.join(workspace,'source','project','index.html');
  if(!(await exists(source))) throw new Error(`project source missing: ${source}`);

  const outputDir=path.join(workspace,'qa','run-v1');
  await guardOutput(outputDir,workspace,Boolean(options.force));
  await mkdir(outputDir,{recursive:true});
  await writeJson(path.join(outputDir,MARKER),{runner:RUNNER,version:VERSION,workspace});

  const chromium=await findChromiumExecutable(options.chromiumPath);
  const workers=Math.max(1,Math.min(8,Number(options.workers)||4));
  const noSandbox=options.noSandbox===true||(typeof process.getuid==='function'&&process.getuid()===0);
  const projectHtml=await readFile(source,'utf8');
  const qaHtml=path.join(outputDir,'qa-frame.html');
  await writeFile(qaHtml,bootstrapHtml(projectHtml),'utf8');
  const htmlUrl=pathToFileURL(qaHtml).href;
  const framesDir=path.join(outputDir,'frames');
  const profilesDir=path.join(outputDir,'.chromium');

  await renderAllFrames({chromium,htmlUrl,framesDir,profilesDir,plan,workers,noSandbox});
  const metrics=await calculateMetrics(framesDir,plan);
  await writeJson(path.join(outputDir,'qa_metrics.json'),metrics);

  const keyframes=keyframesFromStoryboard(storyboard,plan);
  const geometry=[];
  for(let i=0;i<keyframes.length;i++){
    const frame=keyframes[i];
    const audit=await auditFrame({chromium,htmlUrl,profilesDir,frame,worker:i%workers,noSandbox});
    const violations=inspectGeometry(audit,plan.mode,frame);
    geometry.push({frame,audit,violations});
  }
  const geometryViolations=geometry.flatMap(item=>item.violations);
  await writeJson(path.join(outputDir,'geometry_audit.json'),{
    stage:STAGE,
    keyframes,
    violationCount:geometryViolations.length,
    violations:geometryViolations,
    samples:geometry
  });

  const contacts=contactFrames(plan);
  const contactPath=path.join(outputDir,'contact_sheet.png');
  await buildSheet(framesDir,plan,contacts,contactPath,5);

  const transitionFrames=[];
  for(const item of metrics.topTransitions.slice(0,6)){
    transitionFrames.push(item.a,item.b);
  }
  const uniqueTransitions=[...new Set(transitionFrames)];
  const transitionsPath=path.join(outputDir,'transitions_sheet.png');
  await buildSheet(framesDir,plan,uniqueTransitions.length?uniqueTransitions:[0,plan.frames-1],transitionsPath,6);

  const failures=[];
  if(metrics.frameCount!==plan.frames) failures.push({gate:'frame-count',expected:plan.frames,actual:metrics.frameCount});
  const maxDup=Number(plan.qaGates?.maxExactAdjacentDuplicates??0);
  if(metrics.exactAdjacentDuplicates.length>maxDup) failures.push({gate:'exact-duplicates',max:maxDup,actual:metrics.exactAdjacentDuplicates.length});
  if(metrics.hardJumps.length) failures.push({gate:'hard-jumps',threshold:HARD_JUMP_THRESHOLD,actual:metrics.hardJumps.length});
  if(geometryViolations.length) failures.push({gate:'geometry',actual:geometryViolations.length});

  const passed=failures.length===0;
  const artifacts={
    frames:'qa/run-v1/frames',
    metrics:'qa/run-v1/qa_metrics.json',
    geometry:'qa/run-v1/geometry_audit.json',
    contactSheet:'qa/run-v1/contact_sheet.png',
    transitionsSheet:'qa/run-v1/transitions_sheet.png'
  };
  const report={
    runner:RUNNER,
    version:VERSION,
    projectId:plan.projectId,
    mode:plan.mode,
    status:passed?'AUTO_PASS':'FAIL',
    manualVisualApprovalRequired:true,
    visualApproved:false,
    browser:{executable:path.basename(chromium),platform:platformLabel(),workers},
    thresholds:{hardJump:HARD_JUMP_THRESHOLD,maxExactAdjacentDuplicates:maxDup},
    failures,
    metrics,
    geometry:{keyframes,violationCount:geometryViolations.length},
    artifacts,
    providerCalls:0,
    externalSpend:0
  };
  await writeJson(path.join(outputDir,'qa-report.json'),report);
  await rm(profilesDir,{recursive:true,force:true});
  await rm(qaHtml,{force:true});
  const nextState=await updateState(workspace,passed,artifacts);
  return {workspace,outputDir,report,state:nextState};
}

export { keyframesFromStoryboard, contactFrames, inspectGeometry, HARD_JUMP_THRESHOLD };
