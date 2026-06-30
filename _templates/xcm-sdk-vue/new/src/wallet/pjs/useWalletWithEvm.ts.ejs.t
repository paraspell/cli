---
to: src/wallet/pjs/useWalletWithEvm.ts
skip_if: <%= (!(evmWallet && client === 'pjs')).toString() %>
---
<%- h.includeShared('shared/wallet/useWalletWithEvm.sdk.vue.ejs.t') %>
