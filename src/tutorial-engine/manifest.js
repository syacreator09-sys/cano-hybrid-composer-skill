import { getTutorialMode, MODE_IDS } from './modes.js';
import { routeTutorialBrief } from './router.js';
import { getOutputProfile } from './shared/layout.js';
import { DEFAULT_QA_GATES } from './shared/qa.js';

const PROJECT_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;

export function validateTutorialManifest(input) {
  const errors = [];
  if (input?.version !== '1.0') errors.push('version must be 1.0');
  if (!PROJECT_ID.test(input?.projectId ?? '')) errors.push('invalid projectId');
  if (typeof input?.brief !== 'string' || !input.brief.trim()) errors.push('brief is required');
  if (input?.mode !== undefined && !['auto', ...MODE_IDS].includes(input.mode)) errors.push('mode unsupported');
  if (input?.canvas !== undefined && !['9:16','16:9'].includes(input.canvas)) errors.push('canvas unsupported');
  if (input?.fps !== undefined && !(Number(input.fps) >= 12 && Number(input.fps) <= 60)) errors.push('fps must be 12-60');
  if (input?.durationSeconds !== undefined && !(Number(input.durationSeconds) >= 4 && Number(input.durationSeconds) <= 180)) errors.push('durationSeconds must be 4-180');
  if (input?.audio?.enabled !== undefined && typeof input.audio.enabled !== 'boolean') errors.push('audio.enabled must be boolean');
  return { ok: errors.length === 0, errors };
}

export function compileTutorialPlan(input) {
  const check = validateTutorialManifest(input);
  if (!check.ok) throw new Error(check.errors.join('; '));

  const route = routeTutorialBrief(input.brief, { modeHint: input.mode ?? 'auto' });
  const mode = getTutorialMode(route.mode);
  const canvas = input.canvas ?? '9:16';
  const output = getOutputProfile(canvas);
  const fps = Number(input.fps ?? mode.defaultFps);
  const durationSeconds = Number(input.durationSeconds ?? mode.defaultDurationSeconds);
  const audioEnabled = input.audio?.enabled ?? false;

  return {
    version: '1.0',
    projectId: input.projectId,
    brief: input.brief,
    mode: mode.id,
    modeLabel: mode.label,
    router: route,
    baseline: mode.baseline,
    canvas,
    resolution: { width: output.width, height: output.height },
    safeZones: output.safeZones,
    fps,
    durationSeconds,
    frames: Math.round(durationSeconds * fps),
    visualPolicy: {
      generatedAssets: mode.generatedAssets,
      codeOwns: mode.codeOwns,
      criticalReadableTextInCode: true,
      deterministicFrameFunction: 'renderAt(frame)'
    },
    audioPolicy: {
      enabled: audioEnabled,
      visualMasterFirst: true,
      providerIntegration: 'external-only',
      preferredProvider: 'ElevenLabs',
      mixOnlyAfterVisualApproval: true
    },
    qaGates: DEFAULT_QA_GATES,
    productionSteps: [
      'route brief to mode',
      'create storyboard',
      'select or generate only necessary visual assets',
      'build readable UI and connectors in code',
      'implement deterministic motion lifecycle',
      'inspect keyframes and geometry',
      'render silent visual master',
      'run temporal QA',
      'mix approved external audio assets if enabled',
      'export publication master'
    ]
  };
}
