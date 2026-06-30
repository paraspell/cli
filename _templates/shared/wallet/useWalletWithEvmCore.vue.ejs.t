import { computed, ref, unref, watch } from "vue";
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
  const activeWalletKind = ref<WalletKind>("substrate");

  watch(
    () => ({
      walletKind: activeWalletKind.value,
      accountCount: unref(substrate.accounts).length,
      extensionNames: unref(substrate.extensionNames),
      selectedExtensionName: unref(substrate.selectedExtensionName),
    }),
    ({ walletKind, accountCount, extensionNames, selectedExtensionName }) => {
      if (walletKind !== "substrate") return;
      if (accountCount > 0) return;
      if (extensionNames.length === 0) return;

      const name = selectedExtensionName ?? extensionNames[0];
      void substrate.selectExtension(name);
    },
    { immediate: true },
  );

  const buildSubmitOptions = (
    from: <%= projectKind === 'sdk' ? 'TChain' : 'string' %>,
  ): WalletSubmitOptions<TSigner> | null => {
    if (activeWalletKind.value === "evm") {
      const walletClient = evm.getWalletClient(from);
      if (!walletClient || !evm.selectedProvider.value) return null;
      return {
        kind: "evm",
        walletClient,
        provider: evm.selectedProvider.value.provider,
      };
    }

    const substrateConnection = unref(substrate.connection);
    if (!substrateConnection) return null;
    return {
      kind: "substrate",
      signer: substrateConnection.signer,
      senderAddress: substrateConnection.address,
    };
  };

  const connection = computed(() =>
    activeWalletKind.value === "substrate" ? unref(substrate.connection) : null,
  );

  const selectedAddress = computed(() =>
    activeWalletKind.value === "evm"
      ? evm.selectedAddress.value
      : unref(substrate.selectedAddress),
  );

  const setActiveWalletKind = (kind: WalletKind) => {
    activeWalletKind.value = kind;
  };

  return {
    ...substrate,
    connection,
    selectedAddress,
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
