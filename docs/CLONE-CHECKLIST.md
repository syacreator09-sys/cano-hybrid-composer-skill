# Clone checklist

After cloning:

```bash
npm install
npm run init
npm run verify
node bin/cano-compose.js doctor
node bin/cano-compose.js render examples/avatar-screen-short.json --mock
```

Before live:

- install FFmpeg and FFprobe;
- place approved assets in local paths;
- run `probe`;
- verify canvas, duration and fit;
- use `--live --approve-render` only after review;
- inspect the final MP4 before publication.
