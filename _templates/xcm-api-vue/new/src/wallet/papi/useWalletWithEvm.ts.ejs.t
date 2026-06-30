---
to: src/wallet/papi/useWalletWithEvm.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/wallet/useWalletWithEvm.api.vue.ejs.t') %>
