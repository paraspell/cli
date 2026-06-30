---
to: src/evm/index.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/index.api.ejs.t') %>
