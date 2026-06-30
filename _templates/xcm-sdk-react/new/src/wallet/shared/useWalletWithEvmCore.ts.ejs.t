---
to: src/wallet/shared/useWalletWithEvmCore.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/wallet/useWalletWithEvmCore.react.ejs.t') %>
