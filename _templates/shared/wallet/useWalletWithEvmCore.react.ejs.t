import { useCallback, useEffect, useState } from "react";
<% if (projectKind === 'sdk') { %>import type { TChain } from "<%= sdkPackage %>";
<% } %>import { useEvmWallet } from "../evm/useEvmWallet";
import type {
  SubstrateWalletBase,
  WalletKind,
  WalletSubmitOptions,
} from "../../types";

export const useWalletWithEvmCore = <TSigner>(
  substrate: SubstrateWalletBase<TSigner>,
) => {
  const evm = useEvmWallet();

  const [activeWalletKind, setActiveWalletKind] =
    useState<WalletKind>("substrate");

  useEffect(() => {
    if (activeWalletKind !== "substrate") return;
    if (substrate.accounts.length > 0) return;
    if (substrate.extensionNames.length === 0) return;

    const name =
      substrate.selectedExtensionName ?? substrate.extensionNames[0];
    void substrate.selectExtension(name);
  }, [activeWalletKind, substrate]);

  const buildSubmitOptions = useCallback(
    (from: <%= projectKind === 'sdk' ? 'TChain' : 'string' %>): WalletSubmitOptions<TSigner> | null => {
      if (activeWalletKind === "evm") {
        const walletClient = evm.getWalletClient(from);
        if (!walletClient || !evm.selectedProvider) return null;
        return {
          kind: "evm",
          walletClient,
          provider: evm.selectedProvider.provider,
        };
      }

      if (!substrate.connection) return null;
      return {
        kind: "substrate",
        signer: substrate.connection.signer,
        senderAddress: substrate.connection.address,
      };
    },
    [activeWalletKind, evm, substrate.connection],
  );

  return {
    ...substrate,
    connection:
      activeWalletKind === "substrate" ? substrate.connection : null,
    selectedAddress:
      activeWalletKind === "evm"
        ? evm.selectedAddress
        : substrate.selectedAddress,
    activeWalletKind,
    setActiveWalletKind,
    buildSubmitOptions,
    evmAccounts: evm.accounts,
    evmProviderOptions: evm.providerOptions,
    selectedEvmProviderUuid: evm.selectedProviderUuid,
    discoverEvmProviders: evm.discoverProviders,
    selectEvmProvider: evm.selectProvider,
    selectEvmAccount: evm.selectAccountByAddress,
    disconnectEvm: evm.disconnect,
    getEvmWalletClient: evm.getWalletClient,
  };
};
