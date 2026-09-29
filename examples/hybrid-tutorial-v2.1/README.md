# CANO Hybrid Tutorial V2.1 — Approved Production Example

**Status:** APPROVED composition baseline.

This folder freezes the exact production logic used for the approved V2.1 tutorial so future sessions do not reconstruct it from memory.

## What V2.1 is

A hybrid motion-graphics tutorial:

- **2 generated images** provide visual richness.
- **HTML/CSS** owns every important readable UI/text element.
- **SVG** owns connectors and paths.
- **JavaScript** owns deterministic timing, camera and lifecycle.
- The visual is rendered frame-by-frame in Chromium/Playwright.
- FFmpeg assembles the silent MP4.
- No Runway, Veo, Kling or other image-to-video model is used.

## Approved composition grammar

1. **Input** — woman/phone + coded message bubble.
2. **Understand** — centered AI orb + coded extracted-data chips.
3. **Act** — symmetric CRM and Agenda cards with a centered coded action hub.
4. **Result** — one large centered confirmation card.

The V2 composition bug was fixed by enforcing a single grid and one clear hierarchy per phase.

## Source of truth

- `index.html` is self-contained and includes the two visual assets as embedded image data.
- `PRODUCTION_MANIFEST.json` records render facts, hashes, QA and the approved design rules.
- `render_frames.py` reproduces the deterministic frames.
- `qa_frames.py` measures duplicate/low-motion behavior.

## Reproduce

Requirements:

```bash
python -m pip install playwright pillow numpy
playwright install chromium
ffmpeg -version
```

Render 288 frames at 24 fps:

```bash
python examples/hybrid-tutorial-v2.1/render_frames.py
```

Create the approved 1080x1920 silent master:

```bash
ffmpeg -y -framerate 24 -i examples/hybrid-tutorial-v2.1/output/frames/%03d.jpg \
  -vf "scale=1080:1920:flags=lanczos" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  examples/hybrid-tutorial-v2.1/output/CANO_Hybrid_Tutorial_V2_1_1080x1920.mp4
```

Run frame QA:

```bash
python examples/hybrid-tutorial-v2.1/qa_frames.py
```

## Do not regress

- Do not bake critical tutorial copy into generated images.
- Do not use one giant generated infographic as the main animation layer.
- Do not reintroduce the floating mini-orb between CRM and Agenda.
- Do not redesign the V2.1 grid when working on V2.2.
- V2.2 is for **motion-density refinement**, camera polish and handoffs.

## Audio

V2.1 is intentionally a silent visual master. If audio is added later, ElevenLabs is the approved layer for voice, music and SFX; it does not generate the visual motion.
