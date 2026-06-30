---
to: src/evm/getViemChain.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/getViemChain.ejs.t') %>
