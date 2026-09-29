import { createHash } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { compileTutorialPlan } from '../manifest.js';
import { getProductionBaseline } from './baselines.js';
import { buildModeScaffold } from './builders.js';

const WORKSPACE_MARKER = '.cano-tutorial-workspace.json';
const WORKSPACE_VERSION = '1.0';

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

async function sha256File(file) {
  const data = await readFile(file);
  return createHash('sha256').update(data).digest('hex');
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function resolveWorkspace(workRoot, plan, outputDir) {
  if (outputDir) return path.resolve(outputDir);
  return path.resolve(workRoot, '.runtime', 'tutorial-engine', 'jobs', plan.projectId);
}

async function guardWorkspace(workspace, plan, force) {
  if (!(await exists(workspace))) return;
  if (!force) throw new Error(`workspace already exists: ${workspace}; pass --force to rebuild`);
  const markerPath = path.join(workspace, WORKSPACE_MARKER);
  if (!(await exists(markerPath))) throw new Error(`refusing to delete unmarked directory: ${workspace}`);
  const marker = JSON.parse(await readFile(markerPath, 'utf8'));
  if (marker.projectId !== plan.projectId || marker.workspaceVersion !== WORKSPACE_VERSION) {
    throw new Error(`refusing to delete workspace with mismatched marker: ${workspace}`);
  }
  await rm(workspace, { recursive: true, force: true });
}

async function materializeBaseline(repoRoot, workspace, plan) {
  const baseline = getProductionBaseline(plan.mode);
  const copied = [];
  for (const relative of baseline.files) {
    const source = path.resolve(repoRoot, relative);
    if (!(await exists(source))) throw new Error(`baseline file missing: ${relative}`);
    const destination = path.join(workspace, 'source', 'baseline', relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
    copied.push({
      relative,
      destination: path.relative(workspace, destination).split(path.sep).join('/'),
      sha256: await sha256File(destination)
    });
  }
  return { id: baseline.id, files: copied };
}

function buildQaPlan(plan) {
  return {
    status: 'pending',
    expectedFrames: plan.frames,
    fps: plan.fps,
    durationSeconds: plan.durationSeconds,
    safeZones: plan.safeZones,
    gates: plan.qaGates,
    inspections: [
      { id:'keyframes', status:'pending', requirement:'inspect hook, every scene handoff and final payoff' },
      { id:'geometry', status:'pending', requirement:'no safe-area violations, clipping, collision or accidental overflow' },
      { id:'temporal', status:'pending', requirement:'inspect dense transition frames; reject hard camera resets and unexplained holds' },
      { id:'duplicates', status:'pending', requirement:'exact adjacent duplicate count must be <= configured gate' }
    ]
  };
}

function buildAudioPlan(plan, manifest) {
  const enabled = plan.audioPolicy.enabled;
  return {
    enabled,
    provider: plan.audioPolicy.preferredProvider,
    providerIntegration: plan.audioPolicy.providerIntegration,
    status: enabled ? 'blocked-until-visual-approved' : 'disabled',
    visualMasterFirst: true,
    slots: enabled ? [
      { id:'voiceover', type:'speech', status:'pending', required:true, notes:'Generate only after visual approval.' },
      { id:'sfx', type:'sfx', status:'pending', required:false, notes:'Use only meaningful interaction accents.' },
      { id:'music', type:'music', status:'pending', required:false, notes:'Keep below speech; no audio generation during visual QA.' }
    ] : [],
    requested: manifest.audio ?? { enabled:false }
  };
}

function buildRenderPlan(plan, scaffold) {
  return {
    status: 'source-prepared',
    canvas: plan.canvas,
    resolution: plan.resolution,
    fps: plan.fps,
    durationSeconds: plan.durationSeconds,
    frames: plan.frames,
    codec: 'H.264',
    audio: false,
    deterministicFrameFunction: plan.visualPolicy.deterministicFrameFunction,
    sourceStrategy: scaffold.sourceStrategy,
    stages: [
      'adapt baseline source',
      'render exact frames',
      'run QA',
      'encode silent master',
      'approve visual master',
      'mix external approved audio',
      'encode publication master'
    ]
  };
}

function buildState(plan) {
  return {
    workspaceVersion: WORKSPACE_VERSION,
    projectId: plan.projectId,
    mode: plan.mode,
    stage: 'scaffolded',
    gates: {
      assetsReady: false,
      sourceReady: false,
      visualRendered: false,
      visualQaPassed: false,
      visualApproved: false,
      audioReady: !plan.audioPolicy.enabled,
      publicationMasterReady: false
    }
  };
}

export async function buildProductionWorkspace(manifest, options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const workRoot = path.resolve(options.workRoot ?? process.cwd());
  const plan = compileTutorialPlan(manifest);
  const workspace = resolveWorkspace(workRoot, plan, options.outputDir);
  await guardWorkspace(workspace, plan, Boolean(options.force));
  await mkdir(workspace, { recursive: true });

  const marker = { workspaceVersion: WORKSPACE_VERSION, projectId: plan.projectId, mode: plan.mode };
  await writeJson(path.join(workspace, WORKSPACE_MARKER), marker);
  await writeJson(path.join(workspace, 'manifest.json'), manifest);
  await writeJson(path.join(workspace, 'plan.json'), plan);

  const scaffold = buildModeScaffold(plan, manifest);
  await writeJson(path.join(workspace, 'storyboard.json'), scaffold.storyboard);
  await writeJson(path.join(workspace, 'assets', 'ASSET_SLOTS.json'), { mode:plan.mode, slots:scaffold.assetSlots });
  await writeJson(path.join(workspace, 'audio', 'audio-plan.json'), buildAudioPlan(plan, manifest));
  await writeJson(path.join(workspace, 'qa', 'qa-plan.json'), buildQaPlan(plan));
  await writeJson(path.join(workspace, 'render', 'render-plan.json'), buildRenderPlan(plan, scaffold));
  await writeJson(path.join(workspace, 'state.json'), buildState(plan));

  let baseline = { id:plan.baseline, files:[] };
  if (options.materializeBaseline !== false) baseline = await materializeBaseline(repoRoot, workspace, plan);

  const lock = {
    workspaceVersion: WORKSPACE_VERSION,
    projectId: plan.projectId,
    mode: plan.mode,
    baseline,
    generated: [
      'manifest.json','plan.json','storyboard.json','assets/ASSET_SLOTS.json','audio/audio-plan.json',
      'qa/qa-plan.json','render/render-plan.json','state.json'
    ]
  };
  await writeJson(path.join(workspace, 'production.lock.json'), lock);
  await writeFile(
    path.join(workspace, 'README.md'),
    `# ${plan.projectId}\n\nMode: **${plan.mode}**\nBaseline: **${plan.baseline}**\n\nThis workspace was created by CANO Production Runner V1.\nDo not add provider credentials here.\nVisual QA must pass before audio generation or mixing.\n`,
    'utf8'
  );

  return { workspace, plan, baseline, state: buildState(plan) };
}

async function collectFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes:true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) result.push(...await collectFiles(root, full));
    else result.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return result.sort();
}

export async function inspectProductionWorkspace(workspaceDir) {
  const workspace = path.resolve(workspaceDir);
  const markerPath = path.join(workspace, WORKSPACE_MARKER);
  if (!(await exists(markerPath))) throw new Error(`not a CANO tutorial workspace: ${workspace}`);
  const [marker, state, lock] = await Promise.all([
    readFile(markerPath,'utf8').then(JSON.parse),
    readFile(path.join(workspace,'state.json'),'utf8').then(JSON.parse),
    readFile(path.join(workspace,'production.lock.json'),'utf8').then(JSON.parse)
  ]);

  const integrity = [];
  for (const file of lock.baseline?.files ?? []) {
    const target = path.join(workspace, file.destination);
    const ok = await exists(target) && (await sha256File(target)) === file.sha256;
    integrity.push({ file:file.destination, ok });
  }

  return {
    workspace,
    marker,
    state,
    baselineIntegrity: {
      checked: integrity.length,
      ok: integrity.every((item)=>item.ok),
      files: integrity
    },
    files: await collectFiles(workspace)
  };
}
