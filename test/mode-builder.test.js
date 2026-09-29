import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { buildProductionWorkspace } from '../src/tutorial-engine/production/runner.js';
import { buildModeSource } from '../src/tutorial-engine/mode-builder/builder.js';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

function screenManifest(overrides={}){
  const content={
    logos:['n8n','WhatsApp'],
    titleLine1:'WhatsApp → n8n',
    titleAccent:'paso a paso',
    browserUrl:'https://app.n8n.io/workflow/ventas',
    workflowName:'Workflows / Leads WhatsApp',
    startNode:{name:'WhatsApp',meta:'Trigger'},
    targetNode:{name:'Webhook',meta:'POST /lead',searchTerm:'Webhook'},
    nextNode:{name:'Agente IA',meta:'Extrae datos'},
    config:{path:'lead-whatsapp'},
    success:{title:'Mensaje recibido',body:'Payload capturado y enviado al flujo.'},
    captions:['1. Abre tu workflow','2. Añade un Webhook','3. Configura el endpoint','4. Envía un mensaje de prueba'],
    ...(overrides.content??{})
  };
  return {
    version:'1.0',projectId:overrides.projectId??'whatsapp-n8n-screen-v1',
    brief:'Cómo conectar WhatsApp a n8n en 15 segundos',
    mode:'screen_tutorial',canvas:'9:16',durationSeconds:15,fps:24,audio:{enabled:false},
    ...overrides,
    content
  };
}

async function scaffold(manifest){
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-mode-builder-'));
  const workspace=path.join(root,'job');
  await buildProductionWorkspace(manifest,{repoRoot,outputDir:workspace});
  return {root,workspace};
}

async function build(manifest){
  const env=await scaffold(manifest);
  const result=await buildModeSource(env.workspace);
  return {...env,result};
}

async function readJson(file){return JSON.parse(await readFile(file,'utf8'))}

async function cleanup(...roots){for(const root of roots) await rm(root,{recursive:true,force:true})}

test('1. screen builder generates canonical source and preserves V1.2 contract',async()=>{
  const {root,result}=await build(screenManifest());
  try{
    const html=await readFile(result.indexHtml,'utf8');
    assert.match(html,/SCREEN TUTORIAL · MODE BUILDER V1/);
    assert.match(html,/WhatsApp → n8n/);
    assert.match(html,/n8nLogoIcon/);
    assert.match(html,/waLogo/);
    assert.match(html,/function renderAt\(frame\)/);
    assert.match(html,/window\.renderAt=renderAt/);
    assert.equal(result.report.readyForRender,true);
  }finally{await cleanup(root)}
});

test('2. same input produces identical project source files and hashes',async()=>{
  const a=await build(screenManifest({projectId:'deterministic-screen'}));
  const b=await build(screenManifest({projectId:'deterministic-screen'}));
  try{
    for(const relative of ['index.html','project-data.json','render-config.json','assets/registry.json']){
      const [left,right]=await Promise.all([
        readFile(path.join(a.result.outputDir,relative),'utf8'),
        readFile(path.join(b.result.outputDir,relative),'utf8')
      ]);
      assert.equal(left,right,relative);
    }
    const ah=a.result.report.sourceFilesGenerated.filter(x=>x.sha256).map(x=>[x.path,x.sha256]);
    const bh=b.result.report.sourceFilesGenerated.filter(x=>x.sha256).map(x=>[x.path,x.sha256]);
    assert.deepEqual(ah,bh);
  }finally{await cleanup(a.root,b.root)}
});

test('3. changing title changes project data but not locked baseline hashes',async()=>{
  const a=await build(screenManifest({projectId:'title-a',content:{titleLine1:'Título A'}}));
  const b=await build(screenManifest({projectId:'title-b',content:{titleLine1:'Título B'}}));
  try{
    const [pa,pb,la,lb]=await Promise.all([
      readJson(path.join(a.result.outputDir,'project-data.json')),
      readJson(path.join(b.result.outputDir,'project-data.json')),
      readJson(path.join(a.workspace,'production.lock.json')),
      readJson(path.join(b.workspace,'production.lock.json'))
    ]);
    assert.notEqual(pa.content.titleLine1,pb.content.titleLine1);
    assert.deepEqual(la.baseline.files.map(x=>[x.relative,x.sha256]),lb.baseline.files.map(x=>[x.relative,x.sha256]));
  }finally{await cleanup(a.root,b.root)}
});

test('4. missing logo is unresolved and never invented',async()=>{
  const {root,workspace,result}=await build(screenManifest({content:{logos:['n8n','Missing Brand']}}));
  try{
    assert.equal(result.report.readyForRender,false);
    assert.equal(result.report.unresolvedAssets.length,1);
    assert.equal(result.report.unresolvedAssets[0].name,'Missing Brand');
    const state=await readJson(path.join(workspace,'state.json'));
    assert.equal(state.gates.assetsReady,false);
    await assert.rejects(readFile(path.join(result.outputDir,'assets','missing-brand.svg'),'utf8'));
  }finally{await cleanup(root)}
});

test('5. builder refuses to overwrite arbitrary source directory even with force',async()=>{
  const {root,workspace}=await scaffold(screenManifest({projectId:'guard-output'}));
  try{
    const arbitrary=path.join(workspace,'source','project');
    await mkdir(arbitrary,{recursive:true});
    await writeFile(path.join(arbitrary,'keep.txt'),'do not delete','utf8');
    await assert.rejects(()=>buildModeSource(workspace,{force:true}),/refusing to delete unmarked source directory/);
    assert.equal(await readFile(path.join(arbitrary,'keep.txt'),'utf8'),'do not delete');
  }finally{await cleanup(root)}
});

test('6. build rejects a production lock that no longer matches the plan',async()=>{
  const {root,workspace}=await scaffold(screenManifest({projectId:'lock-guard'}));
  try{
    const lockPath=path.join(workspace,'production.lock.json');
    const lock=await readJson(lockPath);
    await writeFile(lockPath,JSON.stringify({...lock,mode:'workflow'},null,2)+'\n','utf8');
    await assert.rejects(()=>buildModeSource(workspace),/production lock mode does not match plan/);
  }finally{await cleanup(root)}
});

test('7. state advances scaffolded to source-built without crossing visual gates',async()=>{
  const {root,workspace}=await build(screenManifest({projectId:'state-transition'}));
  try{
    const state=await readJson(path.join(workspace,'state.json'));
    assert.equal(state.stage,'source-built');
    assert.equal(state.gates.sourceReady,true);
    assert.equal(state.gates.assetsReady,true);
    assert.equal(state.gates.visualRendered,false);
    assert.equal(state.gates.visualQaPassed,false);
    assert.equal(state.gates.visualApproved,false);
    assert.equal(state.gates.publicationMasterReady,false);
  }finally{await cleanup(root)}
});

test('8. source build does not activate audio',async()=>{
  const manifest=screenManifest({projectId:'audio-gate',audio:{enabled:true}});
  const {root,workspace}=await build(manifest);
  try{
    const [state,audio]=await Promise.all([
      readJson(path.join(workspace,'state.json')),
      readJson(path.join(workspace,'audio','audio-plan.json'))
    ]);
    assert.equal(state.gates.audioReady,false);
    assert.equal(audio.status,'blocked-until-visual-approved');
  }finally{await cleanup(root)}
});

test('9. source build performs no fetch/network calls',async()=>{
  const originalFetch=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async()=>{calls+=1;throw new Error('network disabled in test')};
  const env=await scaffold(screenManifest({projectId:'no-network'}));
  try{
    await buildModeSource(env.workspace);
    assert.equal(calls,0);
  }finally{
    globalThis.fetch=originalFetch;
    await cleanup(env.root);
  }
});

test('10. build report and render config carry hashes, assets and 360-frame expectation',async()=>{
  const {root,result}=await build(screenManifest({projectId:'report-contract'}));
  try{
    const render=await readJson(path.join(result.outputDir,'render-config.json'));
    const registry=await readJson(path.join(result.outputDir,'assets','registry.json'));
    assert.equal(render.frames,360);
    assert.equal(render.fps,24);
    assert.equal(render.durationSeconds,15);
    assert.equal(render.audio,false);
    assert.match(result.report.inputManifest.sha256,/^[a-f0-9]{64}$/);
    assert.match(result.report.productionLock.sha256,/^[a-f0-9]{64}$/);
    assert.equal(result.report.frameExpectation.frames,360);
    assert.equal(registry.policy.networkDownloads,false);
    assert.equal(registry.policy.autoInventAssets,false);
    assert.ok(registry.resolved.some(item=>item.registryId==='n8n'));
    assert.ok(registry.resolved.some(item=>item.registryId==='whatsapp'));
  }finally{await cleanup(root)}
});

test('11. screen motion, field labels and scene captions are data-driven',async()=>{
  const manifest=screenManifest({
    projectId:'motion-data',
    content:{
      captions:undefined,
      steps:[
        {action:'open',caption:'Abre el flujo'},
        {action:'select',caption:'Selecciona Webhook'},
        {action:'configure',caption:'Configura endpoint'},
        {action:'test',caption:'Prueba el mensaje'}
      ],
      config:{labels:{method:'MÉTODO',path:'RUTA',response:'RESPUESTA'}},
      motion:{phaseBoundaries:[3.1,6.4,10.1]}
    }
  });
  const {root,result}=await build(manifest);
  try{
    const html=await readFile(result.indexHtml,'utf8');
    const project=await readJson(path.join(result.outputDir,'project-data.json'));
    assert.match(html,/>MÉTODO<\/label>/);
    assert.match(html,/PROJECT_MOTION=/);
    assert.deepEqual(project.content.motion.phaseBoundaries,[3.1,6.4,10.1]);
    assert.equal(project.content.captions[3],'4. Prueba el mensaje');
  }finally{await cleanup(root)}
});


test('12. workflow builder retains code-owned nodes and deterministic renderAt',async()=>{
  const manifest={
    version:'1.0',projectId:'workflow-builder-regression',
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
  }finally{await cleanup(root)}
});

test('13. explainer builder retains Hybrid V2.2 motion and substitutes content',async()=>{
  const manifest={
    version:'1.0',projectId:'explainer-builder-regression',
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
  }finally{await cleanup(root)}
});

test('14. marked source rebuild still requires explicit force and supports safe rebuild',async()=>{
  const manifest=screenManifest({projectId:'source-force-regression'});
  const {root,workspace}=await build(manifest);
  try{
    await assert.rejects(()=>buildModeSource(workspace),/project source already exists/);
    const rebuilt=await buildModeSource(workspace,{force:true});
    assert.equal(rebuilt.report.builder,'CANO Mode Builder V1');
    assert.equal(rebuilt.report.readyForRender,true);
  }finally{await cleanup(root)}
});
