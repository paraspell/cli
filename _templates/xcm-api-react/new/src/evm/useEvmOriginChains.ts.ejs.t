---
to: src/evm/useEvmOriginChains.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/evm/useEvmOriginChains.react.ejs.t') %>
