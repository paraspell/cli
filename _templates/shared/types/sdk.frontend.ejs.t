import type { TAssetInfo, TChain<% if (swap) { %>, TExchangeChain<% } %> } from "<%= sdkPackage %>";
<% if (client === 'papi' && evmWallet) { %>
import type { PolkadotSigner } from "polkadot-api";
<% } %><% if ((client === 'pjs' || client === 'dedot') && evmWallet) { %>
import type { Signer } from "@polkadot/api/types";
<% } %><% if (evmWallet) { %><% if (framework === 'vue') { %>
import type { ComputedRef, Ref } from "vue";
<% } %>
import type { WalletClient } from "viem";
import type { EIP1193Provider } from "mipd";
<% } %>

<%- h.includeShared('shared/types/common.ejs.t') %>

export type FormValues = {
  from: TChain;
  to: TChain;
  currencyOptionId: string;
  recipient: string;
  amount: string;
  currency: TAssetInfo;<% if (swap) { %>
  swapEnabled?: boolean;
  currencyTo?: TAssetInfo;
  exchange?: TExchangeChain[];<% } %>
};

<% if (evmWallet) { %>
<%- h.includeShared('shared/types/wallet.evm.ejs.t') %>
<% } %>
