import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildProductionWorkspace, inspectProductionWorkspace } from '../src/tutorial-engine/production/runner.js';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const manifest = {
  version:'1.0',
  projectId:'whatsapp-n8n-screen',
  brief:'Cómo conectar WhatsApp a n8n paso a paso y configurar el nodo Webhook',
  mode:'auto',
  canvas:'9:16',
  durationSeconds:15,
  fps:24,
  audio:{enabled:true},
  content:{logos:['n8n','WhatsApp']}
};

test('builds a reproducible screen-tutorial production workspace', async () => {
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-prod-'));
  const output=path.join(root,'job');
  try {
    const built=await buildProductionWorkspace(manifest,{repoRoot,outputDir:output});
    assert.equal(built.plan.mode,'screen_tutorial');
    assert.equal(built.plan.frames,360);

    const storyboard=JSON.parse(await readFile(path.join(output,'storyboard.json'),'utf8'));
    assert.equal(storyboard.scenes.length,4);

    const assets=JSON.parse(await readFile(path.join(output,'assets','ASSET_SLOTS.json'),'utf8'));
    assert.equal(assets.slots.filter((item)=>item.type==='logo').length,2);

    const audio=JSON.parse(await readFile(path.join(output,'audio','audio-plan.json'),'utf8'));
    assert.equal(audio.status,'blocked-until-visual-approved');

    const inspected=await inspectProductionWorkspace(output);
    assert.equal(inspected.baselineIntegrity.ok,true);
    assert.ok(inspected.files.includes('production.lock.json'));
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});

test('refuses to overwrite an existing workspace without force', async () => {
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-prod-'));
  const output=path.join(root,'job');
  try {
    await buildProductionWorkspace(manifest,{repoRoot,outputDir:output});
    await assert.rejects(
      ()=>buildProductionWorkspace(manifest,{repoRoot,outputDir:output}),
      /workspace already exists/
    );
    const rebuilt=await buildProductionWorkspace(manifest,{repoRoot,outputDir:output,force:true});
    assert.equal(rebuilt.plan.projectId,manifest.projectId);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});

test('force refuses to delete an arbitrary unmarked directory', async () => {
  const root=await mkdtemp(path.join(os.tmpdir(),'cano-prod-'));
  const output=path.join(root,'job');
  try {
    await mkdir(output,{recursive:true});
    await writeFile(path.join(output,'do-not-delete.txt'),'sentinel');
    await assert.rejects(
      ()=>buildProductionWorkspace(manifest,{repoRoot,outputDir:output,force:true}),
      /refusing to delete unmarked directory/
    );
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
