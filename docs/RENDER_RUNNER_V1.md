# CANO Render Runner V1

**Status: QA-FRAME ENCODER / SILENT MASTER**

Render Runner V1 consumes the exact PNG sequence already reviewed by QA Runner V1. It never re-renders project HTML.

```text
QA AUTO_PASS frames
→ verify contiguous frame sequence
→ hash every source frame
→ FFmpeg H.264 encode
→ ffprobe output validation
→ silent-master.mp4
→ human visual approval
```

## Command

```bash
cano-tutorial render .runtime/tutorial-engine/jobs/<projectId>
```

Optional local runtime overrides:

```bash
cano-tutorial render <workspace> --ffmpeg /path/to/ffmpeg --ffprobe /path/to/ffprobe
cano-tutorial render <workspace> --crf 20 --preset medium
cano-tutorial render <workspace> --force
```

`--force` only replaces `render/run-v1/` when its CANO Render Runner marker matches the current workspace.

## Required gate

Render Runner refuses to run unless:

- `visualQaPassed=true`;
- `qa/run-v1/qa-report.json` has `status=AUTO_PASS`;
- `visualApproved=false`;
- every expected QA frame exists in exact contiguous order.

## Output

```text
render/run-v1/
├── .cano-render-run.json
├── source-frame-manifest.json
├── encode-plan.json
├── silent-master.mp4
└── render-manifest.json
```

`source-frame-manifest.json` records every QA frame SHA-256 plus one ordered sequence SHA-256. This binds the silent master to the exact reviewed frame sequence.

## Encode contract

V1 uses the repository's existing FFmpeg defaults:

- H.264 / libx264;
- target resolution from the tutorial plan;
- exact tutorial FPS;
- exact expected frame count;
- `yuv420p`;
- `+faststart`;
- no audio stream;
- metadata stripped from the output container.

The QA stage is 720×1280 for 9:16. Render Runner scales the already-reviewed frames to the production plan resolution, normally 1080×1920.

## Output validation

After FFmpeg finishes, ffprobe must confirm:

- codec = H.264;
- width/height = planned output resolution;
- FPS = planned FPS;
- decoded frame count = planned frame count;
- audio stream count = 0.

A failed validation does not advance production state.

## State

Successful encoding advances:

```text
stage = silent-master-rendered
silentMasterReady = true
visualApproved = false
publicationMasterReady = false
```

Human visual approval remains a separate gate. Render Runner does not enable audio and does not publish.

## Provider boundary

Render Runner V1 makes:

- **0 generative provider calls**
- **0 external generation spend**
- **0 publishing actions**

FFmpeg and ffprobe run locally and only on QA-approved workspace files.
