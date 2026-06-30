---
to: src/wallet/<%= clientDir %>/index.ts
---
<% if (evmWallet) { %>export {
  useWalletWithEvm as useWallet,
  WalletControls,
} from "./useWalletWithEvm";
export { WalletKindSelector } from "../evm";
export type { UseWalletReturn, WalletKind, WalletKindSelectorProps } from "../../types";
<% } else if (client === 'pjs') { %>export { usePjsWallet } from "./usePjsWallet";
export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
<% } else if (client === 'papi') { %>export { usePapiWallet } from "./usePapiWallet";
export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
<% } else { %>export { useDedotWallet } from "./useDedotWallet";
export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
<% } %>
