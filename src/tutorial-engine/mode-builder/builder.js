import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inspectProductionWorkspace } from '../production/runner.js';
import { buildExplainerHtml } from './explainer.js';
import { buildScreenTutorialHtml } from './screen.js';
import { buildWorkflowHtml } from './workflow.js';
import { readJson, writeJson } from './utils.js';

async function exists(target){try{await access(target);return true}catch{return false}}

async function guardOutput(outputDir,force){
  if(!(await exists(outputDir))) return;
  if(!force) throw new Error(`project source already exists: ${outputDir}; pass --force to rebuild`);
  const reportPath=path.join(outputDir,'build-report.json');
  if(!(await exists(reportPath))) throw new Error(`refusing to delete unmarked source directory: ${outputDir}`);
  const report=await readJson(reportPath);
  if(report.builder!=='CANO Mode Builder V1') throw new Error(`refusing to delete source directory with unknown builder marker: ${outputDir}`);
  await rm(outputDir,{recursive:true,force:true});
}

async function updateWorkspaceState(workspace,report){
  const statePath=path.join(workspace,'state.json');
  const state=await readJson(statePath);
  const next={...state,stage:'source-built',gates:{...state.gates,assetsReady:true,sourceReady:true}};
  await writeJson(statePath,next);
  const renderPath=path.join(workspace,'render','render-plan.json');
  const render=await readJson(renderPath);
  await writeJson(renderPath,{...render,status:'source-built',source:'source/project/index.html'});
  return next;
}

export async function buildModeSource(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const inspection=await inspectProductionWorkspace(workspace);
  if(!inspection.baselineIntegrity.ok) throw new Error('baseline integrity check failed; rebuild the production workspace before building source');

  const [manifest,plan,storyboard]=await Promise.all([
    readJson(path.join(workspace,'manifest.json')),
    readJson(path.join(workspace,'plan.json')),
    readJson(path.join(workspace,'storyboard.json'))
  ]);

  const outputDir=path.join(workspace,'source','project');
  await guardOutput(outputDir,Boolean(options.force));
  await mkdir(outputDir,{recursive:true});

  let built;
  if(plan.mode==='screen_tutorial') built=await buildScreenTutorialHtml({workspace,plan,manifest,storyboard});
  else if(plan.mode==='explainer') built=await buildExplainerHtml({workspace,plan,manifest,storyboard});
  else if(plan.mode==='workflow') built=buildWorkflowHtml({workspace,plan,manifest,storyboard});
  else throw new Error(`unsupported mode builder: ${plan.mode}`);

  await writeFile(path.join(outputDir,'index.html'),built.html,'utf8');
  await writeJson(path.join(outputDir,'project-data.json'),{plan,content:built.content,storyboard});

  const report={
    builder:'CANO Mode Builder V1',
    version:'1.0',
    projectId:plan.projectId,
    mode:plan.mode,
    baseline:plan.baseline,
    output:'source/project/index.html',
    deterministicFrameFunction:'renderAt(frame)',
    generatedAt:null,
    providerCalls:0,
    externalSpend:0,
    ...built.report
  };
  await writeJson(path.join(outputDir,'build-report.json'),report);
  const state=await updateWorkspaceState(workspace,report);
  return {workspace,outputDir,indexHtml:path.join(outputDir,'index.html'),report,state};
}
