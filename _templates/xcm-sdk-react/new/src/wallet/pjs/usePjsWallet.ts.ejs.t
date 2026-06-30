---
to: src/wallet/pjs/usePjsWallet.ts
skip_if: <%= (client !== 'pjs').toString() %>
---
<%- h.includeShared('shared/wallet/useExtensionWallet.react.ejs.t') %>
