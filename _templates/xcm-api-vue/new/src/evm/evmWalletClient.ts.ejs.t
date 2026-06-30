---
to: src/evm/evmWalletClient.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/evmWalletClient.ejs.t') %>
