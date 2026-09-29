# CANO Screen Tutorial Mode V1

**Status: APPROVED / STABLE**

This mode extends the CANO Tutorial Engine from explainer/workflow videos into software walkthroughs.

## What it does

```text
APP UI
+ cursor
+ programmed clicks
+ camera zoom/pan
+ highlights
+ tooltips
+ configuration panels
+ deterministic timeline
= SCREEN TUTORIAL
```

The approved Test 3 demonstrates:

- simulated browser frame;
- application canvas;
- workflow nodes;
- cursor movement;
- click feedback;
- node search;
- node selection;
- right-side configuration panel;
- test action;
- visible success state;
- 9:16 output suitable for Reels/Shorts.

## Logo support

Yes — real logos are supported.

Preferred order:

1. **SVG** — best for logos and UI icons.
2. Transparent PNG/WebP — for assets without usable SVG.
3. Inline SVG — useful for fully self-contained HTML.
4. CSS/glyph fallback — only when an exact logo asset is not available.

Recommended repository structure:

```text
assets/
  logos/
    whatsapp.svg
    n8n.svg
    openai.svg
    hubspot.svg
    salesforce.svg
```

Usage:

```html
<img class="brandLogo" src="./assets/logos/n8n.svg" alt="n8n">
```

or inline SVG when the build must be completely self-contained.

### Brand rule

Use official brand artwork without altering its proportions. Logo use identifies the software being demonstrated; it should not imply sponsorship or endorsement.

## Separation of responsibilities

**Logo/image asset**
- brand mark;
- product screenshot/photo;
- decorative visual.

**Code**
- labels;
- buttons;
- menus;
- text;
- cursor;
- highlights;
- tooltips;
- connectors;
- motion;
- camera;
- interaction feedback.

## Production flow

1. Define the screen/tutorial task.
2. Reconstruct or capture the application interface.
3. Load official logo/icon assets.
4. Define cursor path and click targets.
5. Define camera zoom/pan.
6. Animate state changes deterministically.
7. Inspect keyframes.
8. Render all frames.
9. Audit transitions and holds.
10. Encode silent master.
11. Add audio only after visual approval.

## Output baseline

- 1080x1920
- 24 fps
- 15 s in Test 3
- deterministic render
- silent visual QA master
- 0 exact duplicate adjacent frames

## Promotion rule

Keep this mode stable. Do not redesign it for every tutorial.

Future screen tutorials should change:
- UI content;
- cursor route;
- selected controls;
- labels;
- logos;
- timing.

They should **not** rebuild the engine.
