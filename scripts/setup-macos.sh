#!/usr/bin/env bash
set -euo pipefail
command -v node >/dev/null || { echo "Node.js 20+ is required"; exit 1; }
npm install
mkdir -p .runtime
node bin/cano-compose.js doctor
