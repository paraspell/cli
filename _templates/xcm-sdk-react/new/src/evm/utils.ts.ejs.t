---
to: src/evm/utils.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/utils.ts.ejs.t') %>
