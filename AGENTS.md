# AGENTS.md

This repository is `@cano/hybrid-composer-skill`.

1. Read `README.md`, `SECURITY.md`, `PRIVACY.md`, `USAGE_POLICY.md` and `SKILL.md` before changing behavior.
2. Use Node.js 20+ and portable paths via `node:path` and `node:os`.
3. Never hard-code macOS or Windows user paths.
4. Keep real rendering disabled unless the operator explicitly enables an approved renderer.
5. Preserve scene contracts and add tests before changing timing or rendering behavior.
6. Do not commit source media, customer assets, outputs, credentials or local themes.
7. Do not add GitHub Actions workflows; verification runs locally.
8. Run `npm run verify` before completion.
