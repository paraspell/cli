---
to: src/wallet/dedot/useDedotWallet.ts
skip_if: <%= (client !== 'dedot').toString() %>
---
<%- h.includeShared('shared/wallet/useExtensionWallet.vue.ejs.t') %>
