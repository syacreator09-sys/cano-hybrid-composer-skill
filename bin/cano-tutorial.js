#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { compileTutorialPlan, routeTutorialBrief, validateTutorialManifest } from '../src/tutorial-engine/index.js';

const VERSION = '1.0.0';
const HELP = `CANO Tutorial Engine ${VERSION}

Usage:
  cano-tutorial route <brief...> [--mode auto|explainer|workflow|screen_tutorial]
  cano-tutorial validate <manifest.json>
  cano-tutorial plan <manifest.json>
  cano-tutorial --help | --version

This CLI routes and plans only. It does not call render or audio providers.`;

function optionValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
}
function positionalAfterCommand(args) {
  const result = [];
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === '--mode') { i += 1; continue; }
    result.push(args[i]);
  }
  return result;
}
async function loadJson(file) {
  return JSON.parse(await readFile(path.resolve(file), 'utf8'));
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || ['help','--help','-h'].includes(cmd)) { console.log(HELP); return; }
  if (['version','--version','-v'].includes(cmd)) { console.log(VERSION); return; }

  if (cmd === 'route') {
    const brief = positionalAfterCommand(args).join(' ').trim();
    if (!brief) throw new Error('brief is required');
    console.log(JSON.stringify(routeTutorialBrief(brief, { modeHint: optionValue(args, '--mode', 'auto') }), null, 2));
    return;
  }

  if (['validate','plan'].includes(cmd)) {
    const file = args[1];
    if (!file) throw new Error('manifest file is required');
    const manifest = await loadJson(file);
    const check = validateTutorialManifest(manifest);
    if (cmd === 'validate') {
      console.log(JSON.stringify(check, null, 2));
      if (!check.ok) process.exitCode = 1;
      return;
    }
    if (!check.ok) throw new Error(check.errors.join('; '));
    console.log(JSON.stringify(compileTutorialPlan(manifest), null, 2));
    return;
  }
  throw new Error(`unknown command: ${cmd}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
