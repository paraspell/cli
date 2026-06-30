---
to: src/wallet/evm/useEvmWallet.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/useEvmWallet.vue.ejs.t') %>
