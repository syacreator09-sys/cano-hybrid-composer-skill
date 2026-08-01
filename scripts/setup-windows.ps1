$ErrorActionPreference = "Stop"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 20+ is required" }
npm install
New-Item -ItemType Directory -Force -Path .runtime | Out-Null
node .\bin\cano-compose.js doctor
