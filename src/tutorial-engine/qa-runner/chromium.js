import { access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function executable(file){
  if(!file)return false;
  try{await access(file);return true}catch{return false}
}

export async function findChromiumExecutable(explicit=null){
  const env=explicit||process.env.CANO_CHROMIUM_PATH;
  if(env){
    const resolved=path.resolve(env);
    if(await executable(resolved)) return resolved;
    throw new Error(`configured Chromium executable not found: ${resolved}`);
  }

  const candidates=[];
  if(process.platform==='linux'){
    candidates.push('/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable');
  }else if(process.platform==='darwin'){
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  }else if(process.platform==='win32'){
    const roots=[process.env.LOCALAPPDATA,process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)']].filter(Boolean);
    for(const root of roots){
      candidates.push(
        path.join(root,'Google','Chrome','Application','chrome.exe'),
        path.join(root,'Chromium','Application','chrome.exe')
      );
    }
  }

  for(const candidate of candidates) if(await executable(candidate)) return candidate;
  throw new Error('Chromium/Chrome not found. Set CANO_CHROMIUM_PATH or pass --chromium <path>.');
}

export function chromiumUserDataDir(root,worker){
  return path.join(root,'profiles',`worker-${worker}`);
}

export function platformLabel(){
  return `${os.platform()}-${os.arch()}`;
}
