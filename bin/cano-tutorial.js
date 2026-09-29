#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import {
  buildModeSource,
  buildProductionWorkspace,
  compileTutorialPlan,
  inspectProductionWorkspace,
  routeTutorialBrief,
  runQa,
  runRender,
  validateTutorialManifest
} from '../src/tutorial-engine/index.js';

const VERSION = '1.4.0';
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `CANO Tutorial Engine ${VERSION}

Usage:
  cano-tutorial route <brief...> [--mode auto|explainer|workflow|screen_tutorial]
  cano-tutorial validate <manifest.json>
  cano-tutorial plan <manifest.json>
  cano-tutorial build <manifest.json> [--out directory] [--force] [--no-baseline]
  cano-tutorial source <workspace-directory> [--force]
  cano-tutorial qa <workspace-directory> [--chromium path] [--python path] [--force]
  cano-tutorial render <workspace-directory> [--ffmpeg path] [--ffprobe path] [--crf number] [--preset name] [--force]
  cano-tutorial status <workspace-directory>
  cano-tutorial --help | --version

Production Runner V1 creates the local workspace.
Mode Builder V1 turns that workspace into deterministic project HTML/JS.
QA Runner V1 renders and audits every deterministic frame through Python Playwright + local Chromium.
Render Runner V1 encodes only QA-approved frames into a local silent H.264 master.
These commands do not call paid/external providers or publish content.`;

function optionValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
}

function positionalAfterCommand(args) {
  const result = [];
  const valued = new Set(['--mode','--out','--chromium','--python','--ffmpeg','--ffprobe','--crf','--preset']);
  for (let i = 1; i < args.length; i += 1) {
    if (valued.has(args[i])) { i += 1; continue; }
    if (args[i].startsWith('--')) continue;
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

  if (cmd === 'build') {
    const file = args[1];
    if (!file) throw new Error('manifest file is required');
    const manifest = await loadJson(file);
    const result = await buildProductionWorkspace(manifest, {
      repoRoot: PACKAGE_ROOT,
      workRoot: process.cwd(),
      outputDir: optionValue(args, '--out'),
      force: args.includes('--force'),
      materializeBaseline: !args.includes('--no-baseline')
    });

    console.log(JSON.stringify({
      status:'SCAFFOLDED',
      workspace:result.workspace,
      mode:result.plan.mode,
      baseline:result.plan.baseline,
      frames:result.plan.frames
    }, null, 2));
    return;
  }

  if (cmd === 'source') {
    const workspace = args[1];
    if (!workspace) throw new Error('workspace directory is required');
    const result = await buildModeSource(workspace,{force:args.includes('--force')});
    console.log(JSON.stringify({
      status:'SOURCE_BUILT',
      workspace:result.workspace,
      mode:result.report.mode,
      indexHtml:result.indexHtml,
      providerCalls:result.report.providerCalls,
      externalSpend:result.report.externalSpend
    }, null, 2));
    return;
  }

  if (cmd === 'qa') {
    const workspace = args[1];
    if (!workspace) throw new Error('workspace directory is required');
    const result = await runQa(workspace,{
      force:args.includes('--force'),
      chromiumPath:optionValue(args,'--chromium'),
      pythonPath:optionValue(args,'--python')
    });
    console.log(JSON.stringify({
      status:result.report.status,
      workspace:result.workspace,
      qaDir:result.outputDir,
      frameCount:result.report.metrics.frameCount,
      exactAdjacentDuplicates:result.report.metrics.exactAdjacentDuplicates.length,
      meanFrameDiff:result.report.metrics.meanFrameDiff,
      maxFrameDiff:result.report.metrics.maxDiff,
      geometryViolations:result.report.geometry.violationCount,
      manualVisualApprovalRequired:result.report.manualVisualApprovalRequired
    }, null, 2));
    if(result.report.status!=='AUTO_PASS') process.exitCode=2;
    return;
  }

  if (cmd === 'render') {
    const workspace = args[1];
    if (!workspace) throw new Error('workspace directory is required');
    const crfValue=optionValue(args,'--crf');
    const result = await runRender(workspace,{
      force:args.includes('--force'),
      ffmpegPath:optionValue(args,'--ffmpeg'),
      ffprobePath:optionValue(args,'--ffprobe'),
      crf:crfValue===null?undefined:Number(crfValue),
      preset:optionValue(args,'--preset')??undefined
    });
    console.log(JSON.stringify({
      status:result.report.status,
      workspace:result.workspace,
      renderDir:result.outputDir,
      master:result.report.output.path,
      sha256:result.report.output.sha256,
      bytes:result.report.output.bytes,
      frames:result.report.probe.frames,
      fps:result.report.probe.fps,
      resolution:`${result.report.probe.width}x${result.report.probe.height}`,
      audioStreams:result.report.probe.audioStreams,
      visualApproved:result.report.visualApproved
    }, null, 2));
    return;
  }

  if (cmd === 'status') {
    const workspace = args[1];
    if (!workspace) throw new Error('workspace directory is required');
    console.log(JSON.stringify(await inspectProductionWorkspace(workspace), null, 2));
    return;
  }

  throw new Error(`unknown command: ${cmd}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
