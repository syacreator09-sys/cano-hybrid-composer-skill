# Claude Code Instructions

Use this repository as the standalone `@cano/hybrid-composer-skill` skill.

- Prefer the CLI and JSON contracts over ad-hoc shell commands.
- Start with `npm test` and `npm run doctor`.
- Use mock mode until the operator explicitly approves provider/network activity.
- On Windows, use PowerShell 7 or Git Bash. On macOS, use zsh/bash.
- Keep private runtime state under `.runtime/`.
