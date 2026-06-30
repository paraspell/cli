<% if (evmWallet) { %>
import type { PolkadotSigner } from "polkadot-api";
<% if (framework === 'vue') { %>
import type { ComputedRef, Ref } from "vue";
<% } %>
import type { WalletClient } from "viem";
import type { EIP1193Provider } from "mipd";
<% } %>

<%- h.includeShared('shared/types/common.ejs.t') %>
<%- h.includeShared('shared/types/api.shared.ejs.t') %>

export type FormValues = {
  from: string;
  to: string;
  currency: AssetInfo;
  recipient: string;
  amount: string;<% if (swap) { %>
  swapEnabled?: boolean;
  currencyTo?: AssetInfo;
  exchange?: string[];<% } %>
};

<% if (evmWallet) { %>
export type EvmOriginHelpers = {
  ensureEvmOriginChains: () => Promise<readonly string[]>;
  isEvmOrigin: (chain: string) => boolean;
};

<%- h.includeShared('shared/types/wallet.evm.ejs.t') %>
<% } %>
