import { spawnSync } from 'node:child_process';
import path from 'node:path';

function run(command,args=[]){
  return spawnSync(command,args,{encoding:'utf8',windowsHide:true});
}

function canRun(command,prefixArgs=[]){
  return run(command,[...prefixArgs,'--version']).status===0;
}

function hasPlaywright(command,prefixArgs=[]){
  const result=run(command,[...prefixArgs,'-c','import playwright,sys; print(sys.executable)']);
  return result.status===0;
}

function normalizeConfigured(value){
  if(!value) return null;
  if(value==='python'||value==='python3'||value==='py') return value;
  return path.resolve(value);
}

export function findPythonRuntime(explicit=null){
  const configured=normalizeConfigured(explicit||process.env.CANO_PYTHON_PATH);
  if(configured){
    const prefixArgs=configured==='py'?['-3']:[];
    if(!canRun(configured,prefixArgs)){
      throw new Error(`configured Python executable is not runnable: ${configured}`);
    }
    if(!hasPlaywright(configured,prefixArgs)){
      throw new Error(
        `Python Playwright is unavailable in configured runtime: ${configured}. `+
        `Install it with: ${configured} ${prefixArgs.join(' ')} -m pip install playwright`
      );
    }
    return {command:configured,prefixArgs};
  }

  const candidates=process.platform==='win32'
    ? [{command:'py',prefixArgs:['-3']},{command:'python',prefixArgs:[]}]
    : [{command:'python3',prefixArgs:[]},{command:'python',prefixArgs:[]}];

  const runnable=[];
  for(const candidate of candidates){
    if(!canRun(candidate.command,candidate.prefixArgs)) continue;
    runnable.push(candidate);
    if(hasPlaywright(candidate.command,candidate.prefixArgs)) return candidate;
  }

  if(runnable.length){
    const first=runnable[0];
    const invocation=[first.command,...first.prefixArgs].join(' ');
    throw new Error(
      `Python 3 is available but the Playwright package is missing. `+
      `Install it with: ${invocation} -m pip install playwright, or set CANO_PYTHON_PATH to a Python runtime that already has Playwright.`
    );
  }
  throw new Error('Python 3 not found. Set CANO_PYTHON_PATH or install Python 3.');
}
