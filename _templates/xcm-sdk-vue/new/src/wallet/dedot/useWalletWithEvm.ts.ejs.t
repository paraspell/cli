---
to: src/wallet/dedot/useWalletWithEvm.ts
skip_if: <%= (!(evmWallet && client === 'dedot')).toString() %>
---
<%- h.includeShared('shared/wallet/useWalletWithEvm.sdk.vue.ejs.t') %>
