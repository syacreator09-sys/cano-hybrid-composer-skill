#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { validateComposition } from '../src/validate.js';
import { compileTimeline } from '../src/timeline.js';
import { buildRenderPlan } from '../src/render-plan.js';
import { renderMock } from '../src/mock.js';
import { renderWithFfmpeg } from '../src/ffmpeg-render.js';
import { loadComposerConfig } from '../src/config.js';
import { runComposerSetup } from '../src/setup.js';
import { runComposerDoctor } from '../src/doctor.js';

const VERSION = '0.2.0';
const HELP = `CANO Hybrid Composer ${VERSION}

Usage:
  cano-compose init [--seed config.json] [--config config/composer.local.json]
  cano-compose doctor [--config file]
  cano-compose validate <composition.json>
  cano-compose plan <composition.json> [--config file]
  cano-compose render <composition.json> [--mock|--live --approve-render] [--config file]
  cano-compose --help | --version

Live rendering is local and requires FFmpeg plus --approve-render.`;

async function load(file) { return JSON.parse(await readFile(file, 'utf8')); }
function valueAfter(args, name, fallback = null) { const index = args.indexOf(name); return index >= 0 ? (args[index + 1] ?? fallback) : fallback; }

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || ['help','--help','-h'].includes(cmd)) { console.log(HELP); return; }
  if (['version','--version','-v'].includes(cmd)) { console.log(VERSION); return; }
  const configFile = valueAfter(args, '--config', 'config/composer.local.json');

  if (cmd === 'init') {
    const result = await runComposerSetup({ seedFile:valueAfter(args,'--seed'), outputFile:configFile });
    console.log(JSON.stringify({ status:'CONFIGURED', ...result }, null, 2));
    return;
  }
  if (cmd === 'doctor') { console.log(JSON.stringify(await runComposerDoctor({ configFile }), null, 2)); return; }

  const file = args[1];
  if (!file) throw new Error('composition file is required. Run cano-compose --help');
  const input = await load(file);
  const check = validateComposition(input);
  if (!check.ok) throw new Error(check.errors.join('; '));
  if (cmd === 'validate') { console.log(JSON.stringify({ ok:true, projectId:input.projectId }, null, 2)); return; }
  const timeline = compileTimeline(input);
  const { config } = await loadComposerConfig(configFile);
  if (timeline.duration > config.maxDurationSeconds) throw new Error(`timeline duration ${timeline.duration}s exceeds configured maximum ${config.maxDurationSeconds}s`);
  if (cmd === 'plan') { console.log(JSON.stringify({ timeline, renderPlan:buildRenderPlan(timeline), renderer:config.renderer }, null, 2)); return; }
  if (cmd === 'render') {
    const out = path.resolve(config.runtimeDir, 'jobs', input.projectId, 'composer');
    const live = args.includes('--live');
    if (live && !args.includes('--approve-render')) throw new Error('live local rendering requires --approve-render');
    if (live && config.renderer !== 'ffmpeg') throw new Error('local config renderer must be ffmpeg for live rendering');
    const result = live ? await renderWithFfmpeg(timeline, out, config) : await renderMock(timeline, out);
    console.log(JSON.stringify({ ...result, outDir:out }, null, 2));
    return;
  }
  throw new Error(`unknown command: ${cmd}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
