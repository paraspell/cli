---
to: src/xcm/evmTransfer.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/xcm/evmTransfer.sdk.ejs.t') %>
