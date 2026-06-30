---
to: src/submitEvmTx.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/api/submitEvmTx.ejs.t') %>
