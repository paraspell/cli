---
to: src/evmOrigins.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/evmOrigins.api.node.ejs.t') %>
