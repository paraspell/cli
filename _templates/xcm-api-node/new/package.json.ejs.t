---
to: package.json
---
{
  "name": "<%= projectName %>",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "axios": "<%= axios %>",
    "polkadot-api": "<%= polkadotApi %>",
    "@polkadot/keyring": "<%= polkadotKeyring %>",
    "@polkadot/util-crypto": "<%= polkadotUtilCrypto %>",
    "dotenv": "<%= dotenv %>",
    "express": "<%= express %>"<% if (evmWallet) { %>,
    "viem": "<%= viem %>"<% } %>
  },
  "devDependencies": {
    "@types/express": "<%= typesExpress %>",
    "@types/node": "<%= typesNode %>",
    "tsx": "<%= tsx %>",
    "typescript": "<%= typescript %>"
  }
}
