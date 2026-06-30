---
to: src/evm/evmOrigins.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/evmOrigins.api.frontend.ejs.t') %>
