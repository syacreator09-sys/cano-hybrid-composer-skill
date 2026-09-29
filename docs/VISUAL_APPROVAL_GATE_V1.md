# CANO Visual Approval Gate V1

**Status: EXPLICIT HUMAN VISUAL APPROVAL**

Visual Approval Gate V1 is the boundary between a verified silent visual master and any later audio/publication work.

It does not approve automatically. The human reviewer must confirm the exact SHA-256 of the silent master.

```text
QA AUTO_PASS
→ silent-master.mp4
→ human review
→ confirm exact SHA-256 + reviewer
→ visualApproved=true
→ audio production may be unblocked
```

## Approve

```bash
cano-tutorial approve .runtime/tutorial-engine/jobs/<projectId> \
  --sha256 <exact-64-character-master-sha256> \
  --reviewer "Reviewer name"
```

Optional note:

```bash
cano-tutorial approve <workspace> --sha256 <sha256> --reviewer "Reviewer name" --note "Approved after visual review"
```

Inspect without changing state:

```bash
cano-tutorial approval-status <workspace>
```

## Required prerequisites

Approval is rejected unless:

- visual QA already passed;
- `qa/run-v1/qa-report.json` is `AUTO_PASS`;
- the silent master exists;
- `silentMasterReady=true`;
- `render-manifest.json` is `SILENT_MASTER_READY`;
- the current master bytes still hash to the SHA-256 in the render manifest;
- the human-supplied SHA-256 matches those exact bytes;
- no publication master already exists.

## Approval record

Successful approval writes:

```text
approval/visual-approval.json
```

The record contains:

- project ID;
- reviewer;
- approval timestamp;
- optional note;
- silent-master path + SHA-256 + byte size;
- QA frame count/status;
- source frame sequence SHA-256;
- render-manifest reference;
- zero provider calls / zero external spend.

The record is immutable for a different decision. Repeating the exact same reviewer + SHA-256 + note is idempotent so an interrupted state update can be repaired safely.

## State transition

Successful approval changes:

```text
stage = visual-approved
visualApproved = true
publicationMasterReady = false
```

`audioReady` is **not** automatically set true.

If audio is enabled, `audio/audio-plan.json` changes from:

```text
blocked-until-visual-approved
```

to:

```text
ready-for-audio-production
```

The actual `audioReady` gate remains false until real approved audio assets exist.

If audio is disabled, its existing `audioReady=true` state remains unchanged.

## Safety boundary

Visual Approval Gate V1:

- makes no provider calls;
- spends no credits;
- generates no audio;
- publishes nothing;
- cannot approve a changed/tampered master;
- cannot approve by project ID alone;
- cannot infer human approval from QA AUTO_PASS.
