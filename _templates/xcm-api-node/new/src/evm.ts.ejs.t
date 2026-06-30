---
to: src/evm.ts
skip_if: <%= (!evmWallet).toString() %>
---
<%- h.includeShared('shared/node/getEvmWalletClient.ejs.t') %>
<%- h.includeShared('shared/node/getEvmSenderAddress.ejs.t') %>
export { fetchEvmOriginChains, isEvmOrigin } from "./evmOrigins.js";
