---
to: .gitignore
---
# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

node_modules
dist
dist-ssr
*.local

# Local secrets — never commit private keys, mnemonics, or RPC keys.
# Note: Vite exposes any VITE_-prefixed variable to the client bundle.
.env
.env.local
.env.*.local

# Editor / OS
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
