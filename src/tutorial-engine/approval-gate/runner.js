import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const GATE='CANO Visual Approval Gate V1';
const VERSION='1.0';
const APPROVAL_FILE='visual-approval.json';

async function exists(target){try{await access(target);return true}catch{return false}}
async function readJson(file){return JSON.parse(await readFile(file,'utf8'))}
async function writeJson(file,value){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n','utf8')}
async function sha256File(file){return createHash('sha256').update(await readFile(file)).digest('hex')}

function normalizeSha(value){
  const sha=String(value??'').trim().toLowerCase();
  if(!/^[0-9a-f]{64}$/.test(sha)) throw new Error('approval requires --sha256 with the exact 64-character silent-master SHA-256');
  return sha;
}

function normalizeReviewer(value){
  const reviewer=String(value??'').trim();
  if(!reviewer) throw new Error('approval requires --reviewer identifying the human reviewer');
  if(reviewer.length>120) throw new Error('reviewer must be 120 characters or fewer');
  return reviewer;
}

function normalizeNote(value){
  if(value===undefined||value===null) return null;
  const note=String(value).trim();
  if(note.length>1000) throw new Error('approval note must be 1000 characters or fewer');
  return note||null;
}

export async function inspectVisualApproval(workspaceDir){
  const workspace=path.resolve(workspaceDir);
  const approvalPath=path.join(workspace,'approval',APPROVAL_FILE);
  if(!(await exists(approvalPath))) return {approved:false,approval:null,path:approvalPath};
  return {approved:true,approval:await readJson(approvalPath),path:approvalPath};
}

export async function approveVisualMaster(workspaceDir,options={}){
  const workspace=path.resolve(workspaceDir);
  const expectedSha256=normalizeSha(options.expectedSha256);
  const reviewer=normalizeReviewer(options.reviewer);
  const note=normalizeNote(options.note);
  const approvedAt=String(options.approvedAt??new Date().toISOString());
  if(Number.isNaN(Date.parse(approvedAt))) throw new Error('approvedAt must be a valid ISO-compatible timestamp');

  const [plan,state,qaReport,renderManifest,audioPlan]=await Promise.all([
    readJson(path.join(workspace,'plan.json')),
    readJson(path.join(workspace,'state.json')),
    readJson(path.join(workspace,'qa','run-v1','qa-report.json')),
    readJson(path.join(workspace,'render','run-v1','render-manifest.json')),
    readJson(path.join(workspace,'audio','audio-plan.json'))
  ]);

  if(!state.gates?.visualQaPassed||qaReport.status!=='AUTO_PASS'){
    throw new Error('visual QA has not passed; approval is blocked');
  }
  if(!state.gates?.silentMasterReady||renderManifest.status!=='SILENT_MASTER_READY'){
    throw new Error('silent master is not ready; run cano-tutorial render successfully first');
  }
  if(state.gates?.publicationMasterReady){
    throw new Error('publication master already exists; visual approval cannot be rewritten');
  }

  const approvalPath=path.join(workspace,'approval',APPROVAL_FILE);
  const existingApproval=(await exists(approvalPath))?await readJson(approvalPath):null;

  const masterRel=renderManifest.output?.path;
  if(!masterRel) throw new Error('render manifest does not identify the silent master');
  const masterPath=path.resolve(workspace,masterRel);
  const workspacePrefix=workspace.endsWith(path.sep)?workspace:workspace+path.sep;
  if(masterPath!==workspace&&!masterPath.startsWith(workspacePrefix)){
    throw new Error('render manifest master path escapes the production workspace');
  }
  if(!(await exists(masterPath))) throw new Error(`silent master file missing: ${masterRel}`);

  const actualSha256=await sha256File(masterPath);
  const manifestSha256=normalizeSha(renderManifest.output?.sha256);
  if(actualSha256!==manifestSha256){
    throw new Error(`silent master hash no longer matches render manifest: manifest ${manifestSha256}, actual ${actualSha256}`);
  }
  if(expectedSha256!==actualSha256){
    throw new Error(`approval SHA-256 mismatch: expected confirmation ${expectedSha256}, actual master ${actualSha256}`);
  }

  if(existingApproval){
    const sameDecision=
      existingApproval.decision==='APPROVED'&&
      existingApproval.master?.sha256===actualSha256&&
      existingApproval.reviewer===reviewer&&
      (existingApproval.note??null)===note;
    if(!sameDecision){
      throw new Error(`visual approval already recorded for SHA-256 ${existingApproval.master?.sha256??'unknown'} by ${existingApproval.reviewer??'unknown'}`);
    }
  }

  const approval=existingApproval??{
    gate:GATE,
    version:VERSION,
    projectId:plan.projectId,
    decision:'APPROVED',
    reviewer,
    approvedAt,
    note,
    master:{
      path:masterRel,
      sha256:actualSha256,
      bytes:renderManifest.output?.bytes??null,
      sourceSequenceSha256:renderManifest.sourceSequenceSha256??null
    },
    qa:{
      status:qaReport.status,
      frameCount:qaReport.metrics?.frameCount??plan.frames,
      report:'qa/run-v1/qa-report.json'
    },
    render:{
      status:renderManifest.status,
      manifest:'render/run-v1/render-manifest.json'
    },
    providerCalls:0,
    externalSpend:0
  };
  if(!existingApproval) await writeJson(approvalPath,approval);

  const nextAudioPlan=audioPlan.enabled
    ? {...audioPlan,status:'ready-for-audio-production',visualApproval:'approval/visual-approval.json'}
    : {...audioPlan,status:'disabled',visualApproval:'approval/visual-approval.json'};
  await writeJson(path.join(workspace,'audio','audio-plan.json'),nextAudioPlan);

  const nextState={
    ...state,
    stage:'visual-approved',
    gates:{
      ...state.gates,
      visualApproved:true,
      audioReady:state.gates?.audioReady===true,
      publicationMasterReady:false
    },
    visualApproval:'approval/visual-approval.json'
  };
  await writeJson(path.join(workspace,'state.json'),nextState);

  const renderPlanPath=path.join(workspace,'render','render-plan.json');
  const renderPlan=await readJson(renderPlanPath);
  await writeJson(renderPlanPath,{
    ...renderPlan,
    status:'visual-approved',
    visualApproval:'approval/visual-approval.json',
    approvedMasterSha256:actualSha256
  });

  return {workspace,approvalPath,approval,state:nextState,audioPlan:nextAudioPlan};
}

export { GATE as VISUAL_APPROVAL_GATE, VERSION as VISUAL_APPROVAL_GATE_VERSION };
