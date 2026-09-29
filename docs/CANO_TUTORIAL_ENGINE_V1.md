# CANO Tutorial Engine V1

**Status: PRODUCTION ROUTER / ORCHESTRATION LAYER**

CANO Tutorial Engine V1 unifies the three validated tutorial formats already proven in this repository without rewriting their approved visual engines.

## Modes

### 1. Explainer Mode
Baseline: `hybrid-tutorial-v2.2`

Use for conceptual transformations such as:

```text
message → AI understanding → structured data → result
```

Default visual policy:
- 2 generated visual assets;
- maximum 3 only when a third protagonist is justified;
- all critical readable UI/text in code.

### 2. Workflow Mode
Baseline: `hybrid-tutorial-v2.2`

Use for multi-tool flows such as:

```text
WhatsApp → n8n → AI → CRM
```

Default visual policy:
- 0 generated assets when code/logos are enough;
- maximum 2 generated assets;
- nodes, logos, routing, states and connectors remain code-owned.

### 3. Screen Tutorial Mode
Baseline: `screen-tutorial-v1.2`

Use when the viewer must follow concrete software actions:

```text
open → click → select → configure → test → verify
```

Default visual policy:
- no generated image assets by default;
- real product logos/icons as assets;
- reconstructed or captured application UI;
- cursor, camera, highlights and state transitions in code.

## Router

The router is deterministic and additive. It does not call an AI provider.

Priority:

1. explicit `mode` hint;
2. operational screen actions + UI objects, or step-by-step tool setup → `screen_tutorial`;
3. multi-tool / arrow / integration flow → `workflow`;
4. conceptual explanation → `explainer`.

Example:

```bash
cano-tutorial route "Cómo conectar WhatsApp a n8n paso a paso"
```

Expected mode:

```text
screen_tutorial
baseline: screen-tutorial-v1.2
```

## Manifest contract

```json
{
  "version": "1.0",
  "projectId": "whatsapp-n8n-screen",
  "brief": "Cómo conectar WhatsApp a n8n paso a paso",
  "mode": "auto",
  "canvas": "9:16",
  "durationSeconds": 15,
  "fps": 24,
  "audio": { "enabled": true }
}
```

The compiled plan contains:
- selected mode and baseline;
- output resolution and safe zones;
- exact FPS/duration/frame count;
- generated-asset policy;
- code-owned layers;
- audio gate;
- QA gates;
- production steps.

## Shared production contract

Every mode follows:

```text
BRIEF
→ ROUTER
→ MODE BASELINE
→ STORYBOARD
→ ASSET POLICY
→ CODE-OWNED UI/MOTION
→ KEYFRAME QA
→ SILENT MASTER
→ TEMPORAL QA
→ OPTIONAL EXTERNAL AUDIO
→ PUBLICATION MASTER
```

## Audio boundary

The repository does **not** call audio-generation providers.

The engine only declares the audio policy:

- visual master first;
- external provider integration only;
- ElevenLabs is the preferred production provider;
- audio is mixed only after visual approval.

This preserves the existing repository security model.

## Commands

```bash
cano-tutorial route "WhatsApp → n8n → AI → CRM"
cano-tutorial validate examples/tutorial-engine-v1/screen-tutorial.json
cano-tutorial plan examples/tutorial-engine-v1/screen-tutorial.json
```

## Current stable baselines

- Explainer: `examples/hybrid-tutorial-v2.2/`
- Workflow proof: `docs/PORTABILITY_TEST_2_CHECKPOINT.md`
- Screen tutorial: `examples/screen-tutorial-v1.2/`
- Real logo pattern: `examples/screen-tutorial-logos-v1.1/`

## Versioning rule

Do not redesign a stable mode just because a new topic appears.

Create a new mode/version only when a production example demonstrates a real limitation that cannot be solved by changing content, assets, cursor path, timing or storyboard.


## Production Runner V1

The router/planner can now materialize a deterministic production workspace:

```bash
cano-tutorial build examples/tutorial-engine-v1/screen-tutorial.json
```

The runner creates:

- manifest + compiled plan;
- mode-specific storyboard;
- asset and real-logo slots;
- QA plan;
- silent render plan;
- audio gate;
- production state;
- baseline source bundle;
- SHA-256 production lock.

Inspect it with:

```bash
cano-tutorial status .runtime/tutorial-engine/jobs/<projectId>
```

The runner remains provider-safe: it does not render, publish, or call ElevenLabs. Audio remains blocked until the visual master is approved.

See `docs/PRODUCTION_RUNNER_V1.md`.


## Mode Builder V1

After Production Runner creates a workspace, Mode Builder turns it into actual project source:

```bash
cano-tutorial source .runtime/tutorial-engine/jobs/<projectId>
```

Output:

```text
source/project/index.html
source/project/project-data.json
source/project/build-report.json
```

The three supported adapters are:

- Screen Tutorial → stable V1.2 + project data + real built-in logos.
- Explainer → reconstructed Hybrid V2.2 + project data.
- Workflow → code-first deterministic workflow source.

See `docs/MODE_BUILDER_V1.md`.


## QA Runner V1

After Mode Builder creates project source, QA Runner renders and audits the deterministic visual master:

```bash
cano-tutorial qa .runtime/tutorial-engine/jobs/<projectId>
```

It produces:

- all 720×1280 deterministic frames;
- adjacent-frame motion metrics;
- exact duplicate detection;
- hard-transition detection;
- keyframe geometry audits;
- half-second contact sheet;
- strongest-transition sheet;
- automated PASS/FAIL report.

An automated pass sets `visualQaPassed = true`, but `visualApproved` stays false until human review.

The QA runner calls no external providers and spends no generation credits.

See `docs/QA_RUNNER_V1.md`.
