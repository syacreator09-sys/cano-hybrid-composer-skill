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

Optional controls:

```bash
cano-tutorial qa <workspace> --workers 4
cano-tutorial qa <workspace> --chromium /path/to/chromium
cano-tutorial qa <workspace> --force
```

You may also set:

```text
CANO_CHROMIUM_PATH=/path/to/chromium
```

## Browser strategy

QA Runner V1 intentionally does not depend on Playwright or Puppeteer.

It launches the locally installed Chromium/Chrome executable in headless mode for each deterministic frame. This keeps the repository portable and avoids browser-download dependencies.

The runner detects common Chromium/Chrome locations on:

- Windows
- macOS
- Linux

No external provider is called.

## Output

```text
qa/run-v1/
├── .cano-qa-run.json
├── frames/
│   ├── frame_0000.png
│   ├── frame_0001.png
│   └── ...
├── qa_metrics.json
├── geometry_audit.json
├── contact_sheet.png
├── transitions_sheet.png
└── qa-report.json
```

All frames are preserved so Render Runner V1 can encode the exact QA-reviewed sequence instead of rendering a second, potentially different sequence.

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

At storyboard boundaries, midpoints and transition-adjacent keyframes, the runner calls:

```js
window.audit()
```

Critical readable elements are checked for:

- stage overflow;
- invalid geometry;
- readable-margin violations.

Intentional camera crops, cursor movement and zoomed application canvases are not treated as readable-text safe-area failures.

## Contact sheets

Two deterministic sheets are produced:

- `contact_sheet.png`: half-second cadence plus final frame;
- `transitions_sheet.png`: strongest adjacent-frame transitions.

The PNG parser, scaler and sheet compositor are implemented with Node built-ins only.

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

## State transition

Before:

```text
stage = source-built
sourceReady = true
visualRendered = false
```

After AUTO_PASS:

```text
stage = qa-auto-passed
visualRendered = true
visualQaPassed = true
visualApproved = false
```

After failure:

```text
stage = qa-failed
visualRendered = true
visualQaPassed = false
```

## Provider boundary

QA Runner V1 makes:

- **0 provider calls**
- **0 external spend**
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
