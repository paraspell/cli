---
to: src/wallet/<%= clientDir %>/index.ts
---
<% if (evmWallet) { %>export {
  useWalletWithEvm as useWallet,
  WalletControls,
} from "./useWalletWithEvm";
export { WalletKindSelector } from "../evm/WalletKindSelector";
export type { UseWalletReturn, WalletKind, WalletKindSelectorProps } from "../../types";
<% } else if (client === 'pjs') { %>export { usePjsWallet } from "./usePjsWallet";
export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
<% } else if (client === 'papi') { %>export { usePapiWallet } from "./usePapiWallet";
export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
<% } else { %>export { useDedotWallet } from "./useDedotWallet";
export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
<% } %>
