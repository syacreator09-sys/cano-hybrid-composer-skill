# Contributing

- Use Node.js 20 or 22 and keep behavior portable across Windows, macOS and Linux.
- Add tests before changing scene contracts, timing, safe zones or render plans.
- Keep mock planning usable without render dependencies.
- Never commit private media, generated outputs, `.runtime/`, local themes or customer assets.
- Run `npm run verify` before opening a pull request.
- Document licensing, privacy, accessibility and visual-QA impact for new scene types or renderers.

Use conventional commit prefixes such as `feat:`, `fix:`, `docs:`, `test:` and `chore:`. Report vulnerabilities privately through GitHub Security Advisories or private vulnerability reporting when available.
