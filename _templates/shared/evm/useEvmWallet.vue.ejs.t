import { computed, onMounted, onUnmounted, ref } from "vue";
import type { EIP6963ProviderDetail } from "mipd";
import { getAddress, type WalletClient, isAddress } from "viem";
import { createWalletClient, custom } from "viem";
import { evmProviderStore, getEip6963Providers } from "../../evm/eip6963";
import { createEvmWalletClient } from "../../evm/evmWalletClient";
import { getViemChainForOrigin } from "../../evm/getViemChain";
import {
  parseRequestedAccounts,
  toProviderOptions,
  truncateAddress,
} from "../../evm/utils";
import type { EvmAccountOption, EvmProviderOption } from "../../types";

export const useEvmWallet = () => {
  const providers = ref<readonly EIP6963ProviderDetail[]>(getEip6963Providers());
  const accounts = ref<string[]>([]);
  const selectedAddress = ref<string>();
  const selectedProvider = ref<EIP6963ProviderDetail>();
  const providerOptions = ref<EvmProviderOption[]>([]);

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    unsubscribe = evmProviderStore?.subscribe((nextProviders) => {
      providers.value = nextProviders;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  const handleAccountsChanged = (nextAccounts: string[]) => {
    if (nextAccounts.length === 0) {
      accounts.value = [];
      selectedAddress.value = undefined;
      return;
    }
    accounts.value = nextAccounts;
    const current = selectedAddress.value;
    selectedAddress.value =
      current && nextAccounts.includes(current) ? current : nextAccounts[0];
  };

  const accountOptions = computed((): EvmAccountOption[] =>
    accounts.value.map((address) => ({
      address,
      label: truncateAddress(address),
    })),
  );

  const selectedProviderUuid = computed(
    () => selectedProvider.value?.info.uuid,
  );

  const connectWithProvider = async (providerDetail: EIP6963ProviderDetail) => {
    const provider = providerDetail.provider;
    const requestedAccounts = parseRequestedAccounts(
      await provider.request({ method: "eth_requestAccounts" }),
    );

    if (requestedAccounts.length === 0) {
      alert("No accounts found in the connected wallet.");
      return;
    }

    selectedProvider.value = providerDetail;
    accounts.value = requestedAccounts;
    selectedAddress.value = requestedAccounts[0];
    provider.on?.("accountsChanged", handleAccountsChanged);
  };

  const discoverProviders = async () => {
    try {
      const availableProviders = getEip6963Providers();
      if (availableProviders.length === 0) {
        alert("No EVM-compatible wallet found. Install an EIP-1193 wallet and try again.");
        return;
      }

      providerOptions.value = toProviderOptions(availableProviders);

      if (availableProviders.length === 1) {
        await connectWithProvider(availableProviders[0]);
      }
    } catch {
      alert(
        "Failed to connect. Install an EVM-compatible wallet (EIP-1193) and try again.",
      );
    }
  };

  const selectProvider = async (uuid: string) => {
    const providerDetail = getEip6963Providers().find(
      (entry) => entry.info.uuid === uuid,
    );
    if (!providerDetail) return;
    await connectWithProvider(providerDetail);
  };

  const selectAccountByAddress = (address: string) => {
    selectedAddress.value = address;
  };

  const disconnect = () => {
    const provider = selectedProvider.value?.provider;
    provider?.removeListener?.("accountsChanged", handleAccountsChanged);
    accounts.value = [];
    selectedAddress.value = undefined;
    selectedProvider.value = undefined;
    providerOptions.value = [];
  };

  const getWalletClient = (origin: string): WalletClient | undefined => {
    if (!selectedAddress.value || !selectedProvider.value) return undefined;
    if (!isAddress(selectedAddress.value)) {
      throw new Error("Selected EVM address is invalid.");
    }

    return createWalletClient({
      account: getAddress(selectedAddress.value),
      transport: custom(selectedProvider.value.provider),
      chain: getViemChainForOrigin(origin),
    });
  };

  const getConnectedWalletClient = (origin: string): WalletClient | undefined => {
    if (!selectedProvider.value) return undefined;
    return createEvmWalletClient(origin, selectedProvider.value.provider);
  };

  return {
    accounts: accountOptions,
    providers,
    providerOptions,
    selectedAddress,
    selectedProvider,
    selectedProviderUuid,
    discoverProviders,
    connectWithProvider,
    selectProvider,
    selectAccountByAddress,
    disconnect,
    getWalletClient,
    getConnectedWalletClient,
  };
};
