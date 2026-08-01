# Claude Code Instructions

Use this repository as the standalone `@cano/hybrid-composer-skill` skill.

- Read the security, privacy and responsible-use documents first.
- Prefer the CLI and JSON contracts over ad-hoc shell commands.
- Start with `npm run verify` and `npm run doctor`.
- Use mock mode until the operator explicitly approves real rendering and source assets.
- Never add GitHub Actions workflows; verification runs locally.
- On Windows, use PowerShell 7 or Git Bash. On macOS, use zsh/bash.
- Keep private runtime state under `.runtime/`.
