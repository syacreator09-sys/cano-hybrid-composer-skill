# CANO Hybrid Composer Skill

Compile a universal scene timeline into vertical or horizontal deliverables. Version 0.1 validates assets, computes timing and safe zones, and emits deterministic FFmpeg/Remotion render plans. Mock rendering is the default.

## Quick start

```bash
npm install
npm run verify
node bin/cano-compose.js doctor
node bin/cano-compose.js validate examples/avatar-screen-short.json
node bin/cano-compose.js plan examples/avatar-screen-short.json
node bin/cano-compose.js render examples/avatar-screen-short.json --mock
```

## Documentation

- [Functional options](docs/OPTIONS.md)
- [Security](SECURITY.md)
- [Privacy](PRIVACY.md)
- [Responsible use](USAGE_POLICY.md)
- [Brand and identity rights](BRAND_AND_IDENTITY.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Contributing](CONTRIBUTING.md)
- [MIT License](LICENSE)

Verification is local only; this repository intentionally contains no GitHub Actions workflows.
