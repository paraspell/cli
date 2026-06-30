---
to: src/wallet/papi/useWalletWithEvm.ts
skip_if: <%= (!(evmWallet && client === 'papi')).toString() %>
---
<%- h.includeShared('shared/wallet/useWalletWithEvm.sdk.vue.ejs.t') %>
