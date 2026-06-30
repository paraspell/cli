---
to: .gitignore
---
node_modules
dist

# Local secrets — never commit SUBSTRATE_MNEMONIC, PRIVATE_KEY, or RPC keys.
.env
.env.local
.env.*.local

*.log
.DS_Store
