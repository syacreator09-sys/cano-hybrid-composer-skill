# CANO Hybrid Composer Skill

Compile a universal scene timeline into vertical or horizontal deliverables. Version 0.1 validates assets, computes timing/safe zones and emits deterministic FFmpeg/Remotion render plans. Mock rendering is the default.

```bash
node bin/cano-compose.js validate examples/avatar-screen-short.json
node bin/cano-compose.js plan examples/avatar-screen-short.json
node bin/cano-compose.js render examples/avatar-screen-short.json --mock
```
