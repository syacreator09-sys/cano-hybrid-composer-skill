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
