---
to: src/evm/eip6963.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/eip6963.ts.ejs.t') %>
