import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}

export function jsLiteral(value) {
  return JSON.stringify(String(value ?? ''));
}

export function replaceRequired(source, before, after, label = before.slice(0,80)) {
  if (!source.includes(before)) throw new Error(`builder anchor not found: ${label}`);
  return source.replace(before, after);
}

export function replaceRegexRequired(source, regex, replacement, label) {
  if (!regex.test(source)) throw new Error(`builder pattern not found: ${label}`);
  regex.lastIndex = 0;
  return source.replace(regex, replacement);
}

export async function readJson(file) {
  return JSON.parse(await readFile(file,'utf8'));
}

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive:true });
  await writeFile(file, `${JSON.stringify(value,null,2)}\n`, 'utf8');
}

export function normalizeBrand(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
}
