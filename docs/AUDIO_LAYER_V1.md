# CANO Audio Layer V1

**Status: APPROVED-AUDIO INGEST + LOCAL PUBLICATION MIX**

Audio Layer V1 begins only after the exact silent master has passed QA, rendering and explicit human visual approval.

Pipeline:

```text
visual-approved silent master
→ external ElevenLabs audio assets
→ register + hash + probe
→ local FFmpeg mix
→ publication-master.mp4
→ publication manifest
```

The repository itself makes no ElevenLabs API calls and spends no provider credits.

## Register approved external audio

```bash
cano-tutorial audio-register <workspace> --voice ./voice.mp3
cano-tutorial audio-register <workspace> --voice ./voice.mp3 --sfx ./clicks.wav --music ./bed.mp3
```

Requirements:

- project audio must be enabled;
- visual approval must already exist;
- silent-master SHA-256 must still match the render and approval records;
- voice is required;
- SFX and music are optional.

The runner copies assets into:

```text
audio/run-v1/assets/
```

and writes:

```text
audio/run-v1/audio-assets-manifest.json
```

Every asset is SHA-256 locked and ffprobe-validated.

## Mix publication master

```bash
cano-tutorial audio-mix <workspace>
```

Optional levels:

```bash
cano-tutorial audio-mix <workspace> --voice-volume 1 --sfx-volume 0.65 --music-volume 0.12
```

The mix:

- preserves the approved H.264 video stream with `-c:v copy`;
- resamples audio to 48 kHz stereo;
- mixes voice + optional SFX + optional music;
- encodes one AAC audio stream;
- trims the mix to the planned video duration;
- validates resolution, FPS, frame count and audio codec.

Output:

```text
audio/run-v1/
├── .cano-audio-run.json
├── audio-assets-manifest.json
├── mix-plan.json
├── publication-master.mp4
└── publication-manifest.json
```

## Status

```bash
cano-tutorial audio-status <workspace>
```

## State transitions

After asset registration:

```text
stage = audio-assets-ready
audioReady = true
publicationMasterReady = false
```

After successful mix:

```text
stage = publication-master-ready
audioReady = true
publicationMasterReady = true
```

## Provider boundary

Audio Layer V1 expects voice/music/SFX to be generated externally, normally with ElevenLabs.

Repository provider calls: **0**.

This keeps provider credentials and credit spend outside the deterministic production engine while still locking the exact audio bytes used in the publication master.
