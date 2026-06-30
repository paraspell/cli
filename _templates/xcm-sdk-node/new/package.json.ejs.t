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
    "<%= sdkPackage %>": "<%= sdkVersion %>",
    "@polkadot/keyring": "<%= polkadotKeyring %>",
    "@polkadot/util-crypto": "<%= polkadotUtilCrypto %>",
    "dotenv": "<%= dotenv %>",
    "express": "<%= express %>"<% if (swap) { %>,
    "@paraspell/swap": "<%= sdkVersion %>"<% } %><% if (evm) { %>,
    "@paraspell/evm": "<%= sdkVersion %>"<% } %><% if (evmWallet) { %>,
    "viem": "<%= viem %>"<% } %><% if (snowbridge) { %>,
    "@paraspell/evm-snowbridge": "<%= sdkVersion %>"<% } %><% if (client === 'papi') { %>,
    "polkadot-api": "<%= polkadotApi %>"<% } %><% if (client === 'pjs') { %>,
    "@polkadot/api": "<%= polkadotJsApi %>",
    "@polkadot/types": "<%= polkadotJsApi %>",
    "@polkadot/util": "<%= polkadotUtil %>"<% } %><% if (client === 'dedot') { %>,
    "dedot": "<%= dedot %>"<% } %>
  },
  "devDependencies": {
    "@types/express": "<%= typesExpress %>",
    "@types/node": "<%= typesNode %>",
    "tsx": "<%= tsx %>",
    "typescript": "<%= typescript %>"
  }
}
