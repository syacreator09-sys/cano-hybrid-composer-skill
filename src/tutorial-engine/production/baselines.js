export const PRODUCTION_BASELINES = Object.freeze({
  explainer: Object.freeze({
    id: 'hybrid-tutorial-v2.2',
    files: Object.freeze([
      'examples/hybrid-tutorial-v2.1/index.html',
      'examples/hybrid-tutorial-v2.2/apply_v22_patch.py',
      'examples/hybrid-tutorial-v2.2/motion_v22.css',
      'examples/hybrid-tutorial-v2.2/renderAt_v22.js',
      'examples/hybrid-tutorial-v2.2/GOLDEN_CHECKPOINT.md'
    ])
  }),
  workflow: Object.freeze({
    id: 'hybrid-tutorial-v2.2',
    files: Object.freeze([
      'examples/hybrid-tutorial-v2.1/index.html',
      'examples/hybrid-tutorial-v2.2/apply_v22_patch.py',
      'examples/hybrid-tutorial-v2.2/motion_v22.css',
      'examples/hybrid-tutorial-v2.2/renderAt_v22.js',
      'examples/hybrid-tutorial-v2.2/GOLDEN_CHECKPOINT.md',
      'docs/PORTABILITY_TEST_2_CHECKPOINT.md'
    ])
  }),
  screen_tutorial: Object.freeze({
    id: 'screen-tutorial-v1.2',
    files: Object.freeze([
      'examples/screen-tutorial-test3/index.html',
      'examples/screen-tutorial-logos-v1.1/build.py',
      'examples/screen-tutorial-logos-v1.1/assets/n8n-logo-icon.svg',
      'examples/screen-tutorial-logos-v1.1/assets/n8n-logo-text.svg',
      'examples/screen-tutorial-logos-v1.1/assets/whatsapp.svg',
      'examples/screen-tutorial-v1.2/build.py',
      'docs/CANO_SCREEN_TUTORIAL_MODE.md'
    ])
  })
});

export function getProductionBaseline(mode) {
  const baseline = PRODUCTION_BASELINES[mode];
  if (!baseline) throw new Error(`no production baseline registered for mode: ${mode}`);
  return baseline;
}
