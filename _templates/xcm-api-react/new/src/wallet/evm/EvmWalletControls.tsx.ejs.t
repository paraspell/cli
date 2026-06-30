---
to: src/wallet/evm/EvmWalletControls.tsx
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/EvmWalletControls.react.ejs.t') %>
