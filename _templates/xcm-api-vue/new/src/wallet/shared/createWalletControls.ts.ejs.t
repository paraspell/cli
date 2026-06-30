---
to: src/wallet/shared/createWalletControls.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/wallet/createWalletControls.vue.ejs.t') %>
