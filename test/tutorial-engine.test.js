import test from 'node:test';
import assert from 'node:assert/strict';
import { routeTutorialBrief } from '../src/tutorial-engine/router.js';
import { compileTutorialPlan, validateTutorialManifest } from '../src/tutorial-engine/manifest.js';

test('routes conceptual explanations to explainer mode', () => {
  assert.equal(routeTutorialBrief('Explica cómo una IA entiende un mensaje y confirma una cita').mode, 'explainer');
});

test('routes multi-tool flows to workflow mode', () => {
  assert.equal(routeTutorialBrief('WhatsApp → n8n → IA → CRM: así se mueve un lead').mode, 'workflow');
});

test('routes operational software tutorials to screen tutorial mode', () => {
  const result = routeTutorialBrief('Cómo conectar WhatsApp a n8n paso a paso: haz clic en el nodo Webhook y configura el campo URL');
  assert.equal(result.mode, 'screen_tutorial');
  assert.equal(result.baseline, 'screen-tutorial-v1.2');
});

test('explicit mode hint wins', () => {
  assert.equal(routeTutorialBrief('WhatsApp → n8n → CRM', { modeHint: 'explainer' }).mode, 'explainer');
});

test('manifest compiles a deterministic production plan', () => {
  const input = {
    version: '1.0',
    projectId: 'whatsapp-n8n-15s',
    brief: 'Cómo conectar WhatsApp a n8n paso a paso',
    mode: 'auto',
    canvas: '9:16',
    durationSeconds: 15,
    fps: 24,
    audio: { enabled: true }
  };
  assert.equal(validateTutorialManifest(input).ok, true);
  const plan = compileTutorialPlan(input);
  assert.equal(plan.mode, 'screen_tutorial');
  assert.equal(plan.baseline, 'screen-tutorial-v1.2');
  assert.equal(plan.frames, 360);
  assert.equal(plan.resolution.height, 1920);
  assert.equal(plan.audioPolicy.visualMasterFirst, true);
  assert.equal(plan.audioPolicy.providerIntegration, 'external-only');
});
