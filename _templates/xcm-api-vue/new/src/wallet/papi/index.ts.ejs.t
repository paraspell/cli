---
to: src/wallet/papi/index.ts
---
export { usePapiWallet } from "./usePapiWallet";
export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
<% if (evmWallet) { %>
export {
  useWalletWithEvm as useWallet,
  WalletControls,
} from "./useWalletWithEvm";
export { default as WalletKindSelector } from "../evm/WalletKindSelector.vue";
export type { UseWalletReturn, WalletKind, WalletKindSelectorProps } from "../../types";
<% } %>
