---
to: src/wallet/evm/WalletKindSelector.tsx
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/WalletKindSelector.react.ejs.t') %>
