# CANO QA Runner V1

**Status: DETERMINISTIC FRAME QA**

QA Runner V1 takes a source-built CANO Tutorial workspace and renders every frame through the project's deterministic `window.renderAt(frame)` function.

Pipeline:

```text
source/project/index.html
→ exact frames
→ temporal metrics
→ geometry audit
→ contact sheet
→ transition sheet
→ AUTO_PASS / FAIL
→ manual visual approval gate
```

## Command

```bash
cano-tutorial qa .runtime/tutorial-engine/jobs/<projectId>
```

Optional paths:

```bash
cano-tutorial qa <workspace> --chromium /path/to/chromium
cano-tutorial qa <workspace> --python /path/to/python
cano-tutorial qa <workspace> --force
```

Environment equivalents:

```text
CANO_CHROMIUM_PATH=/path/to/chromium
CANO_PYTHON_PATH=/path/to/python
```

## Runtime

QA uses one local headless Chromium/Chrome process controlled by Python Playwright.

Install the Python package when needed:

```bash
python -m pip install playwright
```

A separate Playwright browser download is not required when a compatible local Chrome/Chromium executable is available.

The generated CANO HTML is loaded with `page.set_content()` rather than `file://`, avoiding managed-environment file URL restrictions.

No generative or paid provider is called.

## Output

```text
qa/run-v1/
├── .cano-qa-run.json
├── frames/
│   ├── frame_0000.png
│   ├── frame_0001.png
│   └── ...
├── driver-audit.json
├── qa_metrics.json
├── geometry_audit.json
├── contact_sheet.png
├── transitions_sheet.png
└── qa-report.json
```

All frames are preserved so Render Runner V1 can encode the exact QA-reviewed sequence instead of rendering a second sequence.

## Temporal metrics

The runner calculates:

- exact adjacent duplicate frames;
- mean adjacent-frame luminance difference;
- low-motion pairs below 0.18;
- very-low-motion pairs below 0.08;
- minimum adjacent-frame difference;
- maximum adjacent-frame difference;
- top transition pairs;
- hard jumps above the V1 threshold.

The comparison samples the 720×1280 internal stage at 4-pixel intervals, matching the effective 180×320 QA sampling used by the approved tutorial experiments.

## Geometry audit

At storyboard boundaries, midpoints and transition-adjacent keyframes, the browser evaluates:

```js
window.audit()
```

Critical readable elements are checked for stage overflow, invalid geometry and readable-margin violations.

Intentional camera crops, cursor movement and zoomed application canvases are not treated as readable-text failures.

## Contact sheets

Two deterministic sheets are produced:

- `contact_sheet.png`: half-second cadence plus final frame;
- `transitions_sheet.png`: strongest adjacent-frame transitions.

PNG decoding, scaling and contact-sheet composition use Node built-ins only.

## Automatic gates

V1 fails automatically when:

- expected frame count is not produced;
- exact duplicate count exceeds the configured gate;
- a hard transition exceeds the V1 threshold;
- critical geometry fails.

A successful automated run produces:

```text
status = AUTO_PASS
visualQaPassed = true
visualApproved = false
```

Human visual approval is still required before audio generation or publication.

## Provider boundary

QA Runner V1 makes:

- **0 provider calls**
- **0 external generation spend**
- **0 publishing actions**

Audio remains blocked until visual approval.

## Next layer

The next component is **Render Runner V1**:

```text
QA-approved frames
→ FFmpeg
→ 1080×1920 H.264 silent master
→ hash + manifest
→ visual approval
→ audio layer
```
