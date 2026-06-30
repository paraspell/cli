---
to: src/wallet/evm/WalletKindSelector.vue
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/WalletKindSelector.vue.ejs.t') %>
