---
to: src/wallet/papi/usePapiWallet.ts
skip_if: <%= (client !== 'papi').toString() %>
---
<%- h.includeShared('shared/wallet/usePapiWallet.vue.ejs.t') %>
