# CANO Production Runner V1

**Status: PRODUCTION SCAFFOLDER / SAFE LOCAL WORKSPACE BUILDER**

Production Runner V1 turns a validated CANO Tutorial Engine manifest into a deterministic local production workspace.

It does not render media, publish content or call paid/external providers.

## Command

    cano-tutorial build examples/tutorial-engine-v1/screen-tutorial.json

Default output:

    .runtime/tutorial-engine/jobs/<projectId>/

Custom output:

    cano-tutorial build manifest.json --out ./my-production

Rebuild an existing CANO workspace:

    cano-tutorial build manifest.json --out ./my-production --force

--force only deletes a directory containing the matching CANO workspace marker. It refuses to delete arbitrary unmarked directories.

## Workspace

    project/
    ├── .cano-tutorial-workspace.json
    ├── manifest.json
    ├── plan.json
    ├── storyboard.json
    ├── production.lock.json
    ├── state.json
    ├── assets/ASSET_SLOTS.json
    ├── audio/audio-plan.json
    ├── qa/qa-plan.json
    ├── render/render-plan.json
    └── source/baseline/

## What the runner does

1. Validates and compiles the tutorial manifest.
2. Routes it to Explainer, Workflow or Screen Tutorial.
3. Creates a mode-specific storyboard scaffold.
4. Creates explicit asset/logo slots.
5. Creates the silent-render plan.
6. Creates the QA gates.
7. Creates the audio gate.
8. Materializes only the approved baseline source files.
9. Hashes every copied baseline file into production.lock.json.
10. Initializes state at scaffolded.

## Integrity check

    cano-tutorial status .runtime/tutorial-engine/jobs/<projectId>

This recomputes baseline SHA-256 hashes and reports whether the workspace still matches the locked production baseline.

## Audio gate

When audio is enabled, the runner creates voiceover, SFX and music slots, but status remains blocked-until-visual-approved.

The repository does not call ElevenLabs or any paid provider. External audio generation remains a separate approved production step.

## Safety

- no credentials stored;
- no external provider calls;
- no automatic publishing;
- no arbitrary directory deletion;
- no source media or outputs committed to Git;
- .runtime/ remains gitignored.

## Current boundary

Production Runner V1 scaffolds and locks the production workspace.

The next layer is the Mode Builder, which consumes storyboard.json, ASSET_SLOTS.json and content parameters to produce adapted per-project HTML/JS source without changing the stable baseline engines.
