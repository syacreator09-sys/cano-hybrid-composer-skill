# CANO Tutorial Engine V1 examples

These manifests exercise the three production modes:

- `explainer.json` → Explainer Mode / Hybrid V2.2
- `workflow.json` → Workflow Mode / Hybrid V2.2
- `screen-tutorial.json` → Screen Tutorial Mode / V1.2

Run:

```bash
node bin/cano-tutorial.js plan examples/tutorial-engine-v1/explainer.json
node bin/cano-tutorial.js plan examples/tutorial-engine-v1/workflow.json
node bin/cano-tutorial.js plan examples/tutorial-engine-v1/screen-tutorial.json
```

These commands plan only. They do not spend credits, call external providers or render media.
