import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inspectProductionWorkspace } from '../production/runner.js';
import { buildExplainerHtml } from './explainer.js';
import { buildScreenTutorialHtml } from './screen.js';
import { buildWorkflowHtml } from './workflow.js';
import { resolveProjectAssets } from './assets.js';
import { applyScreenProjectContract, prepareScreenManifest } from './screen-contract.js';
import { readJson, writeJson } from './utils.js';

async function exists(target){try{await access(target);return true}catch{return false}}
async function sha256File(file){return createHash('sha256').update(await readFile(file)).digest('hex')}

async function guardOutput(outputDir,force){
  if(!(await exists(outputDir))) return;
  if(!force) throw new Error(`project source already exists: ${outputDir}; pass --force to rebuild`);
  const reportPath=path.join(outputDir,'build-report.json');
  if(!(await exists(reportPath))) throw new Error(`refusing to delete unmarked source directory: ${outputDir}`);
  const report=await readJson(reportPath);
  if(report.builder!=='CANO Mode Builder V1') throw new Error(`refusing to delete source directory with unknown builder marker: ${outputDir}`);
  await rm(outputDir,{recursive:true,force:true});
}

function assertProductionLock(lock,plan){
  if(lock.projectId!==plan.projectId) throw new Error('production lock projectId does not match plan');
  if(lock.mode!==plan.mode) throw new Error('production lock mode does not match plan');
  if(lock.baseline?.id!==plan.baseline) throw new Error('production lock baseline does not match plan');
}

async function updateWorkspaceState(workspace,{assetsReady}){
  const statePath=path.join(workspace,'state.json');
  const state=await readJson(statePath);
  const next={...state,stage:'source-built',gates:{...state.gates,assetsReady:Boolean(assetsReady),sourceReady:true}};
  await writeJson(statePath,next);
  const renderPath=path.join(workspace,'render','render-plan.json');
  const render=await readJson(renderPath);
  await writeJson(renderPath,{...render,status:'source-built',source:'source/project/index.html',renderConfig:'source/project/render-config.json'});
  return next;
}

function buildRenderConfig(plan){
  return {
    version:'1.0',
    projectId:plan.projectId,
    mode:plan.mode,
    baseline:plan.baseline,
    canvas:plan.canvas,
    resolution:plan.resolution,
    fps:plan.fps,
    durationSeconds:plan.durationSeconds,
    frames:plan.frames,
    deterministicFrameFunction:'renderAt(frame)',
    entrypoint:'index.html',
    audio:false
  };
}

function buildTimingReport(plan,storyboard,built){
  return {
    fps:plan.fps,
    durationSeconds:plan.durationSeconds,
    frames:plan.frames,
    baselineDurationSeconds:built.report?.baselineDurationSeconds ?? plan.durationSeconds,
    scenes:(storyboard.scenes ?? []).map(scene=>({id:scene.id,order:scene.order,durationSeconds:scene.durationSeconds}))
  };
}

async function hashGeneratedFiles(outputDir,paths){
  const files=[];
  for(const relative of [...new Set(paths)].sort()){
    const absolute=path.join(outputDir,relative);
    if(await exists(absolute)) files.push({path:relative,sha256:await sha256File(absolute)});
  }
  return files;
}

export async function buildModeSource(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const inspection=await inspectProductionWorkspace(workspace);
  if(!inspection.baselineIntegrity.ok) throw new Error('baseline integrity check failed; rebuild the production workspace before building source');

  const manifestPath=path.join(workspace,'manifest.json');
  const lockPath=path.join(workspace,'production.lock.json');
  const assetSlotsPath=path.join(workspace,'assets','ASSET_SLOTS.json');
  const [manifest,plan,storyboard,assetSlots,lock]=await Promise.all([
    readJson(manifestPath),
    readJson(path.join(workspace,'plan.json')),
    readJson(path.join(workspace,'storyboard.json')),
    readJson(assetSlotsPath),
    readJson(lockPath)
  ]);
  assertProductionLock(lock,plan);

  const outputDir=path.join(workspace,'source','project');
  await guardOutput(outputDir,Boolean(options.force));
  await mkdir(outputDir,{recursive:true});

  let built;
  if(plan.mode==='screen_tutorial'){
    const preparedManifest=prepareScreenManifest(manifest);
    built=await buildScreenTutorialHtml({workspace,plan,manifest:preparedManifest,storyboard});
    const screenContent={...built.content,steps:preparedManifest.content.steps??[],motion:preparedManifest.content.motion};
    built={...built,content:screenContent,html:applyScreenProjectContract(built.html,{content:screenContent,manifest:preparedManifest})};
  }
  else if(plan.mode==='explainer') built=await buildExplainerHtml({workspace,plan,manifest,storyboard});
  else if(plan.mode==='workflow') built=buildWorkflowHtml({workspace,plan,manifest,storyboard});
  else throw new Error(`unsupported mode builder: ${plan.mode}`);

  const indexPath=path.join(outputDir,'index.html');
  await writeFile(indexPath,built.html,'utf8');

  const assets=await resolveProjectAssets({
    workspace,
    outputDir,
    assetSlots:assetSlots.slots ?? [],
    mode:plan.mode
  });
  await writeJson(path.join(outputDir,'assets','registry.json'),assets);

  const projectData={
    schemaVersion:'1.0',
    projectId:plan.projectId,
    mode:plan.mode,
    baseline:plan.baseline,
    plan,
    content:built.content,
    storyboard,
    assets:{registry:'assets/registry.json',ready:assets.ready}
  };
  await writeJson(path.join(outputDir,'project-data.json'),projectData);
  await writeJson(path.join(outputDir,'render-config.json'),buildRenderConfig(plan));

  const assetFiles=assets.resolved.flatMap(item=>(item.files ?? []).map(file=>file.path));
  const generatedPaths=['index.html','project-data.json','render-config.json','assets/registry.json',...assetFiles];
  const sourceFilesGenerated=await hashGeneratedFiles(outputDir,generatedPaths);
  const contractPresent=/function renderAt\(frame\)/.test(built.html) && /window\.renderAt=renderAt/.test(built.html);
  const unresolvedRequired=assets.unresolved.filter(item=>item.required);
  const warnings=[
    ...assets.unresolved.map(item=>`unresolved asset: ${item.name} (${item.reason})`),
    ...(!contractPresent?['deterministic renderAt(frame) contract missing']:[])
  ];
  const readyForRender=inspection.baselineIntegrity.ok && contractPresent && unresolvedRequired.length===0;

  const report={
    ...built.report,
    builder:'CANO Mode Builder V1',
    version:'1.0',
    projectId:plan.projectId,
    mode:plan.mode,
    baseline:plan.baseline,
    inputManifest:{path:'manifest.json',sha256:await sha256File(manifestPath)},
    productionLock:{path:'production.lock.json',sha256:await sha256File(lockPath)},
    output:'source/project/index.html',
    deterministicFrameFunction:'renderAt(frame)',
    sourceFilesGenerated:[...sourceFilesGenerated,{path:'build-report.json',sha256:null,selfReported:true}],
    assetResolution:{registry:'assets/registry.json',resolved:assets.resolved,ready:assets.ready},
    unresolvedAssets:assets.unresolved,
    timings:buildTimingReport(plan,storyboard,built),
    frameExpectation:{fps:plan.fps,durationSeconds:plan.durationSeconds,frames:plan.frames},
    warnings,
    readyForRender,
    generatedAt:null,
    providerCalls:0,
    externalSpend:0
  };
  await writeJson(path.join(outputDir,'build-report.json'),report);
  const state=await updateWorkspaceState(workspace,{assetsReady:assets.ready});
  return {workspace,outputDir,indexHtml:indexPath,report,state};
}
