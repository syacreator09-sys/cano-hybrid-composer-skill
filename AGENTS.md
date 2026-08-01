# AGENTS.md

This repository is `@cano/hybrid-composer-skill`.

1. Read `README.md`, `SECURITY.md`, and `SKILL.md` before changing behavior.
2. Use Node.js 20+ and portable paths via `node:path` and `node:os`.
3. Never hard-code macOS or Windows user paths.
4. Keep real provider calls disabled unless the operator passes an explicit live flag.
5. Preserve JSON contracts and add tests before changing them.
6. Do not commit private sessions, avatar IDs, API keys, media outputs, or local profiles.
7. Run `npm test` and `npm run check` before completion.
