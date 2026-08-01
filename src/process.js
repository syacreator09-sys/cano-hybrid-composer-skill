import { spawn, spawnSync } from 'node:child_process';

export function commandVersion(command) {
  const result = spawnSync(command, ['-version'], { encoding: 'utf8' });
  return { ok: result.status === 0, status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.split(/\r?\n/)[0] || null };
}

export function runCommand(command, args, { cwd, onLine } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { const text = chunk.toString(); stdout += text; onLine?.(text); });
    child.stderr.on('data', (chunk) => { const text = chunk.toString(); stderr += text; onLine?.(text); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}
