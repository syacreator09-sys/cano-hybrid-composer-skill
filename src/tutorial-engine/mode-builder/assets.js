import { access, cp, mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { normalizeBrand } from './utils.js';

export const BUILTIN_ASSET_REGISTRY = Object.freeze({
  n8n: Object.freeze({
    id: 'n8n',
    type: 'logo-set',
    provenance: 'repository-verified',
    usage: ['screen_tutorial'],
    files: Object.freeze([
      { id:'n8n-icon', path:'examples/screen-tutorial-logos-v1.1/assets/n8n-logo-icon.svg', output:'n8n-logo-icon.svg', type:'svg' },
      { id:'n8n-wordmark', path:'examples/screen-tutorial-logos-v1.1/assets/n8n-logo-text.svg', output:'n8n-logo-text.svg', type:'svg' }
    ])
  }),
  whatsapp: Object.freeze({
    id: 'whatsapp',
    type: 'logo',
    provenance: 'repository-verified',
    usage: ['screen_tutorial'],
    files: Object.freeze([
      { id:'whatsapp', path:'examples/screen-tutorial-logos-v1.1/assets/whatsapp.svg', output:'whatsapp.svg', type:'svg' }
    ])
  })
});

async function exists(target){try{await access(target);return true}catch{return false}}
async function sha256File(file){return createHash('sha256').update(await readFile(file)).digest('hex')}

function registryEntry(name){return BUILTIN_ASSET_REGISTRY[normalizeBrand(name)] ?? null}

export async function resolveProjectAssets({workspace,outputDir,assetSlots=[],mode}) {
  const assetDir=path.join(outputDir,'assets');
  await mkdir(assetDir,{recursive:true});
  const resolved=[];
  const unresolved=[];

  for(const slot of assetSlots){
    if(slot.type==='generated-visual' && mode==='explainer' && slot.required){
      resolved.push({
        slotId:slot.id,
        requested:slot.purpose ?? slot.id,
        status:'resolved',
        resolution:'embedded-approved-baseline',
        files:[]
      });
      continue;
    }
    if(slot.type!=='logo') continue;
    const entry=registryEntry(slot.name);
    if(!entry){
      unresolved.push({slotId:slot.id,name:slot.name,type:slot.type,required:Boolean(slot.required),reason:'asset-not-in-registry'});
      continue;
    }
    const copied=[];
    let missing=false;
    for(const file of entry.files){
      const source=path.join(workspace,'source','baseline',file.path);
      if(!(await exists(source))){missing=true;break}
      const destination=path.join(assetDir,file.output);
      await cp(source,destination);
      copied.push({
        id:file.id,
        type:file.type,
        path:`assets/${file.output}`,
        sha256:await sha256File(destination)
      });
    }
    if(missing){
      unresolved.push({slotId:slot.id,name:slot.name,type:slot.type,required:Boolean(slot.required),reason:'verified-registry-source-not-materialized'});
      continue;
    }
    resolved.push({
      slotId:slot.id,
      requested:slot.name,
      registryId:entry.id,
      status:'resolved',
      provenance:entry.provenance,
      usage:entry.usage,
      files:copied
    });
  }

  const requiredUnresolved=unresolved.filter(item=>item.required);
  return {
    registryVersion:'1.0',
    mode,
    policy:{networkDownloads:false,autoInventAssets:false},
    resolved,
    unresolved,
    ready:requiredUnresolved.length===0
  };
}
