---
to: src/wallet/shared/submitTransfer.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/wallet/submitTransfer.sdk.ejs.t') %>
