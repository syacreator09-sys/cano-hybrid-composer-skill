# Screen Tutorial — Logos V1.1

**Status: approved.**

This is the stable Screen Tutorial Test 3 with real product-brand SVGs integrated without changing the approved motion architecture.

## What changed

- n8n logo icon + wordmark in the reconstructed application chrome.
- n8n brand icon in the sidebar.
- WhatsApp integration icon in the WhatsApp node.

Everything else remains the stable Test 3:

- deterministic cursor;
- programmed clicks;
- camera zoom/pan;
- highlights/tooltips;
- configuration panel;
- success feedback;
- 9:16 layout.

## Rebuild

From the repository root:

```bash
python examples/screen-tutorial-logos-v1.1/build.py
```

This generates `examples/screen-tutorial-logos-v1.1/index.html` from the approved `screen-tutorial-test3` base.

The logo SVGs are stored locally in `assets/`, so the build does not depend on a network request.

## Rule

```text
real logo = asset
readable UI = HTML/CSS
cursor/camera/interaction = JavaScript
```

See `ASSET_PROVENANCE.md` and `PRODUCTION_MANIFEST.json`.
