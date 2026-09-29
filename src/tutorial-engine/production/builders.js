function baseScene(id, order, title, objective, durationSeconds) {
  return { id, order, title, objective, durationSeconds, status: 'planned' };
}

function distributeDuration(total, weights) {
  const raw = weights.map((weight) => total * weight);
  const rounded = raw.map((value) => Number(value.toFixed(3)));
  const delta = Number((total - rounded.reduce((sum, value) => sum + value, 0)).toFixed(3));
  rounded[rounded.length - 1] = Number((rounded[rounded.length - 1] + delta).toFixed(3));
  return rounded;
}

function logoSlots(manifest) {
  const requested = Array.isArray(manifest?.content?.logos) ? manifest.content.logos : [];
  return requested.map((name, index) => ({
    id: `logo-${String(index + 1).padStart(2, '0')}`,
    type: 'logo',
    name: String(name),
    required: true,
    status: 'missing',
    preferredFormats: ['svg', 'png', 'webp']
  }));
}

export function buildModeScaffold(plan, manifest) {
  const { mode, durationSeconds } = plan;

  if (mode === 'explainer') {
    const d = distributeDuration(durationSeconds, [0.25, 0.25, 0.25, 0.25]);
    return {
      storyboard: {
        mode,
        scenes: [
          baseScene('input', 1, 'Input', 'Introduce the human/message/problem.', d[0]),
          baseScene('understand', 2, 'Understand', 'Show AI understanding or structured extraction.', d[1]),
          baseScene('act', 3, 'Act', 'Show the system taking the meaningful action.', d[2]),
          baseScene('result', 4, 'Result', 'Deliver one clear payoff/result state.', d[3])
        ]
      },
      assetSlots: [
        { id:'visual-01', type:'generated-visual', required:true, status:'missing', purpose:'primary human/product visual' },
        { id:'visual-02', type:'generated-visual', required:true, status:'missing', purpose:'AI/system visual nucleus' },
        { id:'visual-03', type:'generated-visual', required:false, status:'optional', purpose:'only if a third visual protagonist is justified' },
        ...logoSlots(manifest)
      ],
      sourceStrategy: 'materialize hybrid V2.2 baseline; adapt story/content without changing core motion grammar'
    };
  }

  if (mode === 'workflow') {
    const d = distributeDuration(durationSeconds, [0.23, 0.29, 0.25, 0.23]);
    return {
      storyboard: {
        mode,
        scenes: [
          baseScene('input', 1, 'Input', 'Show where the event/message enters.', d[0]),
          baseScene('orchestrate', 2, 'Orchestrate', 'Move the packet through code-owned workflow nodes.', d[1]),
          baseScene('intelligence', 3, 'AI / Rules', 'Extract, classify or transform structured data.', d[2]),
          baseScene('result', 4, 'Destination', 'Show the final CRM/system state and next action.', d[3])
        ]
      },
      assetSlots: [
        ...logoSlots(manifest),
        { id:'visual-01', type:'generated-visual', required:false, status:'optional', purpose:'optional human/product richness' },
        { id:'visual-02', type:'generated-visual', required:false, status:'optional', purpose:'optional AI/system visual nucleus' }
      ],
      sourceStrategy: 'materialize hybrid V2.2 baseline; workflow nodes, routing and states stay code-owned'
    };
  }

  if (mode === 'screen_tutorial') {
    const d = distributeDuration(durationSeconds, [0.2, 0.26, 0.28, 0.26]);
    return {
      storyboard: {
        mode,
        scenes: [
          baseScene('open', 1, 'Open', 'Establish the application/workflow and target area.', d[0]),
          baseScene('select', 2, 'Select / Connect', 'Move cursor, click and select the target control/node.', d[1]),
          baseScene('configure', 3, 'Configure', 'Highlight and edit the minimum required settings.', d[2]),
          baseScene('verify', 4, 'Test / Verify', 'Run the action and show one unmistakable success state.', d[3])
        ]
      },
      assetSlots: [
        ...logoSlots(manifest),
        { id:'screen-reference', type:'screen-reference', required:false, status:'optional', purpose:'optional screenshot/reference for faithful UI reconstruction' }
      ],
      sourceStrategy: 'materialize Screen Tutorial V1.2 chain; cursor/camera/click/highlight behavior remains code-owned'
    };
  }

  throw new Error(`unsupported production mode: ${mode}`);
}
