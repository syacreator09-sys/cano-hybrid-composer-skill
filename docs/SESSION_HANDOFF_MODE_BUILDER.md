# CANO Tutorial Engine — Session Handoff

Date: 2026-09-29

## Canonical repository

`syacreator09-sys/cano-hybrid-composer-skill`

GitHub is the source of truth.

## Current stable main

The following milestones are already merged and must not be rebuilt from memory:

### Hybrid Tutorial
- V2.1 approved composition
- V2.2 approved/golden motion pass
- canonical motion method preserved in repo

### Portability Test 2
- WhatsApp → n8n → AI → CRM
- approved as portability proof
- checkpoint recorded in `docs/PORTABILITY_TEST_2_CHECKPOINT.md`

### Screen Tutorial
- Test 3 approved
- logo integration V1.1 approved
- Screen Tutorial V1.2 approved stable technical baseline
- V1.2 fixes hard camera resets, right-edge clipping and final-state hold

### CANO Tutorial Engine V1
Merged via PR #11.
Canonical merge commit:
`6d7ea460337fdce3ef1d6f31290ae36a4d0cd176`

Includes:
- deterministic router
- Explainer / Workflow / Screen Tutorial modes
- tutorial manifest compiler
- CLI `cano-tutorial`
- shared layout and QA contracts
- example manifests
- tests

### Production Runner V1
Merged via PR #12.
Canonical merge commit:
`4666a226df71b8705c0de970be87756b60710836`

Documentation formatting fix merged via PR #13.
Canonical main checkpoint after fix:
`ec6114d5ee5892ce15a068b36a10b4528503db47`

Includes:
- `cano-tutorial build <manifest.json>`
- `cano-tutorial status <workspace>`
- local deterministic production workspace
- storyboard scaffold
- asset/logo slots
- QA plan
- silent render plan
- audio gate
- production state
- approved baseline materialization
- SHA-256 production lock
- safe `--force` protection
- integrity inspection
- tests

## Production flow now

```text
BRIEF
→ ROUTER
→ MODE
→ PLAN
→ PRODUCTION WORKSPACE
→ [NEXT] MODE BUILDER
→ QA RUNNER
→ RENDER RUNNER
→ VISUAL APPROVAL
→ ELEVENLABS AUDIO
→ PUBLICATION MASTER
```

## Exact next milestone

Build **Mode Builder V1**.

Goal:

Turn the generated production workspace into adapted per-project HTML/JS source without manually editing the approved baseline templates.

Target contract:

```text
workspace/
  manifest.json
  plan.json
  storyboard.json
  assets/ASSET_SLOTS.json
        ↓
MODE BUILDER
        ↓
source/project/
  index.html
  project-data.json
  assets/
  render-config.json
  build-report.json
```

## Mode Builder requirements

### Explainer
- use Hybrid V2.2 as stable baseline
- parameterize title, subtitle, message, extracted fields, action/result
- preserve composition grammar and motion behavior
- critical readable text remains code-owned
- 2 generated assets by default, max 3

### Workflow
- parameterize tools, nodes, labels, handoffs, extracted data, CRM/result state
- connectors, nodes, routing and states remain code-owned
- logos are assets with provenance
- do not redesign Hybrid V2.2

### Screen Tutorial
- use Screen Tutorial V1.2 as stable baseline
- parameterize title, application, steps, cursor targets, clicks, fields, captions and final success state
- preserve V1.2 camera trajectory rules
- no generated visual assets by default
- real logos/icons may be used as assets
- reconstructed UI must not be called official UI unless it actually is

## First integration proof

Use:

`examples/tutorial-engine-v1/screen-tutorial.json`

Topic:

**Cómo conectar WhatsApp a n8n paso a paso y probar el webhook**

Expected:
- mode: `screen_tutorial`
- baseline: `screen-tutorial-v1.2`
- 9:16
- 15 seconds
- 24 fps
- 360 frames
- logos: n8n + WhatsApp
- audio enabled in manifest but still blocked until visual approval

Success criteria:
1. build project source from structured data;
2. no manual edits to baseline HTML after build;
3. deterministic output;
4. baseline remains untouched;
5. builder emits a build report;
6. source is ready for QA/render layer;
7. no paid-provider calls;
8. no publishing;
9. no credentials in repo/runtime artifacts.

## Audio rule

Do not generate audio during Mode Builder work.

Audio comes only after silent visual approval.

Preferred provider: ElevenLabs.

Known Javi voice ID from prior work:
`HxRDsm0E8jdUUrG0lqbK`

Do not use it automatically unless producing the approved audio step.

## Safety / repo rules

- Read `AGENTS.md`, `README.md`, `SECURITY.md`, `PRIVACY.md`, `USAGE_POLICY.md`, `SKILL.md`.
- Node.js 20+.
- No GitHub Actions.
- Do not commit outputs, credentials or customer/source media.
- Keep runtime under `.runtime/`.
- Preserve approved examples as golden fixtures.
- Add tests before changing behavior.
- Run verification before merge.
- Do not claim a PR/merge/test exists unless tool output confirms it.

## Current recommendation

Do not start another visual-format experiment.

Proceed directly with Mode Builder V1, beginning with Screen Tutorial because it is the cleanest parameterization target and already has a stable V1.2 baseline.
