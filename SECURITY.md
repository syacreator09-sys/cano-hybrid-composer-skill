# Security Policy

## Supported versions

Security fixes are applied to the latest release and the active `main` branch.

## Reporting a vulnerability

Do not publish exploits, private media, customer assets, credentials or sensitive render manifests in a public issue. Use GitHub private vulnerability reporting or a private Security Advisory when available.

## Security boundaries

- Mock planning is the default and does not invoke an external renderer.
- Source assets and outputs are local unless the operator explicitly configures external storage or rendering.
- The composer does not grant media, font, codec, identity or trademark rights.

## Asset handling

- Keep source media, generated files, local themes and customer data under `.runtime/` or another ignored directory.
- Validate paths and manifests before passing them to FFmpeg, Remotion, HyperFrames or shell processes.
- Run `npm run audit:release` before sharing or publishing.
- Review every render for private data, unsafe overlays, misleading edits and unintended metadata.

## Dependency review

Review renderer, codec, browser and media-processing advisories before enabling production rendering.
