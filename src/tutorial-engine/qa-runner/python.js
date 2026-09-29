import { spawnSync } from 'node:child_process';
import path from 'node:path';

function probe(command,prefixArgs=[]){
  const result=spawnSync(command,[...prefixArgs,'--version'],{encoding:'utf8',windowsHide:true});
  return result.status===0;
}

export function findPythonRuntime(explicit=null){
  const configured=explicit||process.env.CANO_PYTHON_PATH;
  if(configured){
    const command=path.resolve(configured);
    if(probe(command)) return {command,prefixArgs:[]};
    throw new Error(`configured Python executable is not runnable: ${command}`);
  }

  const candidates=process.platform==='win32'
    ? [{command:'py',prefixArgs:['-3']},{command:'python',prefixArgs:[]}]
    : [{command:'python3',prefixArgs:[]},{command:'python',prefixArgs:[]}];

  for(const candidate of candidates){
    if(probe(candidate.command,candidate.prefixArgs)) return candidate;
  }
  throw new Error('Python 3 not found. Set CANO_PYTHON_PATH or install Python 3.');
}
