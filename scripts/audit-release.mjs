import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const required = ['README.md','LICENSE','SECURITY.md','PRIVACY.md','USAGE_POLICY.md','BRAND_AND_IDENTITY.md','CONTRIBUTING.md','THIRD_PARTY_NOTICES.md','SKILL.md','AGENTS.md','CLAUDE.md'];
const forbiddenPaths = [/^\.github\/workflows\//,/(^|\/)\.runtime\//,/(^|\/)sessions\//,/(^|\/)outputs\//,/\.local\.(json|ya?ml)$/i];
const secretPatterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bghp_[A-Za-z0-9]{20,}\b/,/\bgithub_pat_[A-Za-z0-9_]{20,}\b/,/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}\b/,/\bAIza[0-9A-Za-z_-]{30,}\b/,/HEYGEN_API_KEY\s*=\s*[^\s#]+/];
const tracked = spawnSync('git',['ls-files','-z'],{encoding:'utf8'});
if (tracked.status !== 0) throw new Error('git ls-files failed');
const files = tracked.stdout.split('\0').filter(Boolean);
const failures = [];
for (const file of required) { try { if (!(await stat(file)).isFile()) failures.push(`missing required file: ${file}`); } catch { failures.push(`missing required file: ${file}`); } }
for (const file of files) {
  const normalized = file.split(path.sep).join('/');
  if (forbiddenPaths.some((rule)=>rule.test(normalized))) failures.push(`forbidden tracked path: ${normalized}`);
  if (/\.(png|jpe?g|gif|zip|mp4|mov|webm|mp3|wav|pdf)$/i.test(file)) continue;
  const text = await readFile(file,'utf8').catch(()=> '');
  for (const pattern of secretPatterns) if (pattern.test(text)) failures.push(`possible secret in ${normalized}: ${pattern}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`release audit ok: ${files.length} tracked files, no GitHub Actions, private runtime paths or known secret patterns`);
