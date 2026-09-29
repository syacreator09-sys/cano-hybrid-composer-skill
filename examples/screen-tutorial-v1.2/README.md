# CANO Screen Tutorial Mode V1.2

**Status: approved technical baseline.**

V1.2 keeps the visual design and real-logo integration of V1.1, but fixes the camera and geometry defects found during frame-level QA.

## Fixed

- Removed the hard camera reset at ~6.9 s.
- Removed the second camera reset at ~10.8 s.
- Moved the AI node fully inside the workflow canvas.
- Raised the phase chip above the browser/camera layer.
- Kept the final success state solid through the last frame.
- Added a subtle one-pass settle instead of a static/fading finish.

## Measured result

- V1.1 max frame jump: **11.552**
- V1.2 max frame jump: **3.100**
- Critical frames 165→166: **11.552 → 1.072**
- Low-motion pairs: **197 → 188**
- Very-low-motion pairs: **157 → 64**
- Exact adjacent duplicates: **0**

## Rebuild

```bash
python examples/screen-tutorial-v1.2/build.py
```

The build starts from the approved real-logo V1.1 source and applies only the technical V1.2 corrections.

Future Screen Tutorial productions should use V1.2 as the baseline unless a real production limitation justifies a new version.
