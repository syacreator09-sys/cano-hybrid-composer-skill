# CANO Mode Builder V1

**Status: PROJECT-SOURCE GENERATOR / HARDENED CONTRACT**

Mode Builder V1 converts a Production Runner workspace into deterministic per-project HTML/JS without editing the approved baseline by hand.

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

`--force` only removes `source/project/` when that directory contains a valid CANO Mode Builder report marker. Arbitrary directories are refused.

## Output contract

```text
source/project/
├── index.html
├── project-data.json
├── render-config.json
├── build-report.json
└── assets/
    ├── registry.json
    └── verified copied assets when required
```

The generated HTML exposes:

```js
window.renderAt(frame)
window.audit()
```

The renderer stays deterministic and audio remains disabled during visual production.

## Screen Tutorial builder

Baseline: **Screen Tutorial V1.2**.

The builder preserves the approved layout grammar and V1.2 continuity fixes while moving project-specific data into a structured content contract.

Supported data includes:

- kicker, title and subtitle;
- browser URL and workflow name;
- node labels and sublabels;
- panel labels;
- input labels and values;
- success state;
- four phase labels and footer captions;
- optional four-step input contract;
- cursor targets/timings;
- camera/zoom targets and timings;
- scene/phase timing boundaries;
- logo references.

Motion values use the stable 15-second V1.2 timeline as their baseline and are deterministically time-scaled when output duration changes.

### Canonical proof

```bash
cano-tutorial build examples/tutorial-engine-v1/whatsapp-n8n-screen-v1.json
cano-tutorial source .runtime/tutorial-engine/jobs/whatsapp-n8n-screen-v1
```

Expected render contract:

- 9:16
- 24 fps
- 15 seconds
- 360 frames
- silent visual source

## Asset Registry

Mode Builder V1 includes a lightweight verified asset registry for repository-owned logo references.

Initial verified entries:

- n8n icon + wordmark;
- WhatsApp SVG.

Rules:

- assets are resolved only from already-materialized verified baseline files;
- no network download occurs;
- no logo is invented;
- unknown requested logos are reported as `unresolved`;
- required unresolved assets make `assetsReady=false` and `readyForRender=false`.

The generated `assets/registry.json` records provenance, output paths and SHA-256 hashes.

## Build report

Every source build writes `build-report.json` with:

- projectId;
- mode;
- baseline;
- input manifest SHA-256;
- production lock SHA-256;
- generated source files and hashes;
- asset resolution;
- unresolved assets;
- scene/timing summary;
- frame expectation;
- warnings;
- `readyForRender`;
- provider call count and external spend.

The report is deterministic for the same workspace inputs. `generatedAt` remains `null` by design.

## Production lock

Before generation, Mode Builder verifies:

- baseline file integrity;
- lock projectId matches the compiled plan;
- lock mode matches the compiled plan;
- lock baseline matches the compiled plan.

If these do not match, source generation stops.

## State transition

Successful source generation advances:

```text
stage: scaffolded → source-built
sourceReady: false → true
```

`assetsReady` becomes true only when all required asset slots are actually resolved. Mode Builder does not advance:

- visualRendered;
- visualQaPassed;
- visualApproved;
- publicationMasterReady.

Audio state is preserved. If audio was requested, it remains blocked until visual approval.

## Workflow builder

Workflow Mode remains code-first and accepts:

- 2–6 nodes;
- node labels/meta;
- extraction fields;
- final result state;
- title/subtitle;
- phase labels/captions.

Nodes, connectors, routing and states remain code-owned.

## Explainer builder

Explainer Mode keeps Hybrid Tutorial V2.2 as the approved engine and parameterizes message/extraction/action/result content.

V1 reuses the two approved embedded visual assets rather than generating replacements automatically. A later asset resolver may replace them only through an explicit production step.

## Provider boundary

Mode Builder V1 makes:

- **0 provider calls**
- **0 network asset downloads**
- **0 external spend**
- **0 publishing actions**

Audio generation is outside this layer.

## Verification coverage

`test/mode-builder.test.js` covers at least:

1. canonical Screen source generation;
2. deterministic same-input output;
3. title-only changes without baseline mutation;
4. missing-logo unresolved behavior;
5. arbitrary-directory overwrite protection;
6. production-lock enforcement;
7. state transition and visual gates;
8. audio gate preservation;
9. no fetch/network calls;
10. build-report/render-config/hash contract;
11. data-driven motion/labels/captions.

Before merging Mode Builder changes run:

```bash
npm test
npm run check
npm run audit:release
npm run verify
```

## Next layer

The next production component is **QA Runner V1**, now implemented as the deterministic local frame-audit layer:

```text
project HTML
→ exact frame render
→ geometry checks
→ transition-density checks
→ duplicate detection
→ contact sheets
→ PASS / FAIL
```
