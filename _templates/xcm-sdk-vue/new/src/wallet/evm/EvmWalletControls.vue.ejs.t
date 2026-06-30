---
to: src/wallet/evm/EvmWalletControls.vue
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/EvmWalletControls.vue.ejs.t') %>
