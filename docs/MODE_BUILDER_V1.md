# CANO Mode Builder V1

**Status: PROJECT-SOURCE GENERATOR**

Mode Builder V1 converts a Production Runner workspace into deterministic per-project HTML/JS.

It is the layer between:

```text
brief → router → production workspace → MODE BUILDER → project source → QA → render
```

## Command

```bash
cano-tutorial source .runtime/tutorial-engine/jobs/<projectId>
```

Rebuild generated source:

```bash
cano-tutorial source .runtime/tutorial-engine/jobs/<projectId> --force
```

The builder only deletes `source/project/` when that directory contains its own Mode Builder marker report.

## Output

```text
source/project/
├── index.html
├── project-data.json
└── build-report.json
```

The generated HTML always exposes:

```js
window.renderAt(frame)
window.audit()
```

so QA and rendering can remain deterministic.

## Screen Tutorial builder

Baseline: **Screen Tutorial V1.2**.

The builder:

- starts from the approved Test 3 HTML;
- embeds the real n8n and WhatsApp SVG assets already stored in the baseline bundle;
- reapplies the approved V1.2 camera/geometry fixes;
- substitutes project content from `manifest.content`;
- preserves cursor, click, camera and success-state motion;
- scales time when FPS or duration changes.

Supported project content includes:

- headline and subtitle;
- browser URL and workflow name;
- start/target/next nodes;
- search term;
- Webhook configuration;
- success message;
- four phase labels;
- four captions;
- interaction tips.

## Explainer builder

Baseline: **Hybrid Tutorial V2.2**.

The builder reconstructs V2.2 directly from:

- V2.1 self-contained HTML;
- V2.2 motion CSS;
- V2.2 deterministic `renderAt` source.

It can replace:

- title/subtitle;
- message copy;
- extraction values;
- result title/body;
- result date/time/channel/status;
- four phases/captions.

### Current visual-asset rule

V1 keeps the two embedded approved V2.1 visual assets as placeholders.

A later Asset Resolver stage can replace them with project-specific visuals. The builder does not generate images or spend credits.

## Workflow builder

Workflow Mode is generated code-first with no generated image requirement.

The manifest can define:

- 2–6 workflow nodes;
- node labels/meta;
- extraction fields;
- final CRM/result state;
- headline/subtitle;
- phase labels/captions.

The resulting HTML animates nodes, connectors, structured extraction and final result deterministically.

## Provider boundary

Mode Builder V1 makes:

- **0 provider calls**
- **0 external spend**
- **0 publishing actions**

Audio stays blocked until visual QA and approval.

## State transition

Before:

```text
stage = scaffolded
sourceReady = false
```

After a successful source build:

```text
stage = source-built
sourceReady = true
assetsReady = true
```

The render plan also advances to `source-built`.

## QA handoff

Mode Builder now hands directly to **QA Runner V1**:

```bash
cano-tutorial qa .runtime/tutorial-engine/jobs/<projectId>
```

The QA stage renders the exact deterministic frame sequence, measures temporal continuity, audits critical geometry, creates contact/transition sheets and preserves the reviewed frames for Render Runner V1.

See `docs/QA_RUNNER_V1.md`.
