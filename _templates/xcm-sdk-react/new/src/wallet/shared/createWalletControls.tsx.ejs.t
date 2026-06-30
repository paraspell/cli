---
to: src/wallet/shared/createWalletControls.tsx
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/wallet/createWalletControls.react.ejs.t') %>
