---
to: src/wallet/evm/useEvmWallet.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/useEvmWallet.react.ejs.t') %>
