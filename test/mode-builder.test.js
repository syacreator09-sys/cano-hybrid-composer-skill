import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildProductionWorkspace } from '../src/tutorial-engine/production/runner.js';
import { buildModeSource } from '../src/tutorial-engine/mode-builder/builder.js';

const repoRoot=path.resolve(new URL('..',import.meta.url).pathname);

async function build(manifest){
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-mode-builder-'));
  const workspace=path.join(root,'job');
  await buildProductionWorkspace(manifest,{repoRoot,outputDir:workspace});
  const result=await buildModeSource(workspace);
  return {root,workspace,result};
}

test('screen tutorial source preserves V1.2 and injects project content/logos',async()=>{
  const manifest={
    version:'1.0',projectId:'screen-builder-test',
    brief:'Cómo configurar un Webhook en n8n paso a paso',
    mode:'screen_tutorial',canvas:'9:16',durationSeconds:15,fps:24,audio:{enabled:false},
    content:{
      logos:['n8n','WhatsApp'],
      titleLine1:'Webhook → n8n',
      titleAccent:'sin código',
      targetNode:{name:'Webhook',meta:'POST /demo',searchTerm:'Webhook'},
      config:{path:'demo-cano'}
    }
  };
  const {root,workspace,result}=await build(manifest);
  try{
    const html=await readFile(result.indexHtml,'utf8');
    assert.match(html,/Webhook → n8n/);
    assert.match(html,/sin código/);
    assert.match(html,/n8nLogoIcon/);
    assert.match(html,/waLogo/);
    assert.match(html,/camX=-70\+\(-52\*q\)/);
    assert.match(html,/demo-cano/);
    const state=JSON.parse(await readFile(path.join(workspace,'state.json'),'utf8'));
    assert.equal(state.stage,'source-built');
    assert.equal(state.gates.sourceReady,true);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('workflow builder generates code-owned nodes and deterministic renderAt',async()=>{
  const manifest={
    version:'1.0',projectId:'workflow-builder-test',
    brief:'WhatsApp → n8n → IA → CRM',
    mode:'workflow',canvas:'9:16',durationSeconds:12,fps:24,audio:{enabled:false},
    content:{nodes:[
      {name:'WhatsApp',meta:'Entrada'},
      {name:'n8n',meta:'Orquesta'},
      {name:'IA',meta:'Califica'},
      {name:'CRM',meta:'Registra'}
    ]}
  };
  const {root,result}=await build(manifest);
  try{
    const html=await readFile(result.indexHtml,'utf8');
    assert.match(html,/WORKFLOW · MODE BUILDER V1/);
    assert.match(html,/WhatsApp/);
    assert.match(html,/CRM/);
    assert.match(html,/function renderAt\(frame\)/);
    assert.equal(result.report.providerCalls,0);
    assert.equal(result.report.externalSpend,0);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('explainer builder rebuilds V2.2 motion and substitutes content',async()=>{
  const manifest={
    version:'1.0',projectId:'explainer-builder-test',
    brief:'Explica cómo la IA convierte un mensaje en una cita',
    mode:'explainer',canvas:'9:16',durationSeconds:12,fps:24,audio:{enabled:false},
    content:{
      titleLine1:'Mensaje → IA',
      titleAccent:'acción real',
      message:{copy:'Necesito una demo mañana.'},
      extraction:{intent:'Demo',date:'Mañana',time:'12:00'},
      result:{title:'Demo confirmada',time:'12:00 PM'}
    }
  };
  const {root,result}=await build(manifest);
  try{
    const html=await readFile(result.indexHtml,'utf8');
    assert.match(html,/Mensaje → IA/);
    assert.match(html,/acción real/);
    assert.match(html,/Demo confirmada/);
    assert.match(html,/motionAura/);
    assert.match(html,/EXPLAINER · MODE BUILDER V1/);
    assert.match(html,/function renderAt\(frame\)/);
  }finally{await rm(root,{recursive:true,force:true})}
});

test('source rebuild requires explicit force',async()=>{
  const manifest={
    version:'1.0',projectId:'source-force-test',
    brief:'WhatsApp → n8n → CRM',
    mode:'workflow',canvas:'9:16',durationSeconds:12,fps:24,audio:{enabled:false}
  };
  const {root,workspace}=await build(manifest);
  try{
    await assert.rejects(()=>buildModeSource(workspace),/project source already exists/);
    const rebuilt=await buildModeSource(workspace,{force:true});
    assert.equal(rebuilt.report.builder,'CANO Mode Builder V1');
  }finally{await rm(root,{recursive:true,force:true})}
});
