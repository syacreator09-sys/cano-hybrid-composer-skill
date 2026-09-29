export const TUTORIAL_MODES = Object.freeze({
  explainer: Object.freeze({
    id: 'explainer',
    label: 'Explainer Mode',
    baseline: 'hybrid-tutorial-v2.2',
    defaultDurationSeconds: 12,
    defaultFps: 24,
    generatedAssets: Object.freeze({ default: 2, max: 3 }),
    codeOwns: Object.freeze(['critical text', 'UI cards', 'connectors', 'timing', 'camera', 'handoffs']),
    useWhen: 'The goal is to explain a concept, transformation or outcome with a small number of visual protagonists.'
  }),
  workflow: Object.freeze({
    id: 'workflow',
    label: 'Workflow Mode',
    baseline: 'hybrid-tutorial-v2.2',
    defaultDurationSeconds: 12,
    defaultFps: 24,
    generatedAssets: Object.freeze({ default: 0, max: 2 }),
    codeOwns: Object.freeze(['nodes', 'logos', 'routing', 'data extraction', 'states', 'connectors', 'timing']),
    useWhen: 'The story is a multi-step process across tools, integrations, agents, APIs or CRM states.'
  }),
  screen_tutorial: Object.freeze({
    id: 'screen_tutorial',
    label: 'Screen Tutorial Mode',
    baseline: 'screen-tutorial-v1.2',
    defaultDurationSeconds: 15,
    defaultFps: 24,
    generatedAssets: Object.freeze({ default: 0, max: 0 }),
    codeOwns: Object.freeze(['application UI', 'cursor', 'clicks', 'highlights', 'camera', 'state changes', 'captions']),
    useWhen: 'The viewer must follow concrete actions inside software: open, click, select, configure, test or verify.'
  })
});

export const MODE_IDS = Object.freeze(Object.keys(TUTORIAL_MODES));

export function getTutorialMode(id) {
  const mode = TUTORIAL_MODES[id];
  if (!mode) throw new Error(`unsupported tutorial mode: ${id}`);
  return mode;
}
