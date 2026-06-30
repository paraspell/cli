<%
  const walletLabel = client === 'pjs' ? 'Pjs' : client === 'dedot' ? 'Dedot' : 'Papi';
  const signerType = client === 'papi' ? 'PolkadotSigner' : 'Signer';
%>
import <% if (client === 'papi') { %>type { PolkadotSigner } from "polkadot-api";
<% } else { %>type { Signer } from "@polkadot/api/types";
<% } %>
import type { FormValues } from "../../types";
import { submitUsingSdk } from "../../xcm/<%= client %>";
import { createWalletControls } from "../shared/createWalletControls";
import {
  connectWalletAlert,
  submitEvmIfNeeded,
} from "../shared/submitTransfer";
import { useWalletWithEvmCore } from "../shared/useWalletWithEvmCore";
import type { UseWalletReturn } from "../../types";
import SubstrateWalletControls from "../shared/SubstrateWalletControls.vue";
import { use<%= walletLabel %>Wallet } from "./use<%= walletLabel %>Wallet";

export const WalletControls = createWalletControls(SubstrateWalletControls);

export const useWalletWithEvm = (): UseWalletReturn => {
  const <%= client %> = use<%= walletLabel %>Wallet();

  const core = useWalletWithEvmCore<<%= signerType %>>({
    extensionNames: <%= client %>.extensionNames,
    selectedExtensionName: <%= client %>.selectedExtensionName,
    accounts: <%= client %>.accounts,
    selectedAddress: <%= client %>.selectedAddress,
    connection: <%= client %>.connection,
    discoverExtensions: <%= client %>.discoverExtensions,
    selectExtension: <%= client %>.selectExtension,
    selectAccountByAddress: <%= client %>.selectAccountByAddress,
  });

  const submitTransfer = async (formValues: FormValues) => {
    const options = core.buildSubmitOptions(formValues.from);
    if (!options) {
      connectWalletAlert(core);
      return false;
    }

    if (await submitEvmIfNeeded(formValues, options)) {
      return true;
    }

    await submitUsingSdk(formValues, options);
    return true;
  };

  return { ...core, submitTransfer };
};
