import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import type { EIP6963ProviderDetail } from "mipd";
import { getAddress, type WalletClient } from "viem";
import { createWalletClient, custom, isAddress } from "viem";
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
  const providers = useSyncExternalStore(
    (onStoreChange) => evmProviderStore?.subscribe(onStoreChange) ?? (() => undefined),
    () => getEip6963Providers(),
    () => [],
  );
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>();
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail>();
  const [providerOptions, setProviderOptions] = useState<EvmProviderOption[]>(
    [],
  );

  useEffect(() => {
    const provider = selectedProvider?.provider;
    if (!provider) return;

    const handleAccountsChanged = (nextAccounts: string[]) => {
      if (nextAccounts.length === 0) {
        setAccounts([]);
        setSelectedAddress(undefined);
        return;
      }
      setAccounts(nextAccounts);
      setSelectedAddress((current) =>
        current && nextAccounts.includes(current) ? current : nextAccounts[0],
      );
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [selectedProvider]);

  const accountOptions = useMemo((): EvmAccountOption[] => {
    return accounts.map((address) => ({
      address,
      label: truncateAddress(address),
    }));
  }, [accounts]);

  const selectedProviderUuid = selectedProvider?.info.uuid;

  const connectWithProvider = useCallback(
    async (providerDetail: EIP6963ProviderDetail) => {
      const provider = providerDetail.provider;
      const requestedAccounts = parseRequestedAccounts(
        await provider.request({ method: "eth_requestAccounts" }),
      );

      if (requestedAccounts.length === 0) {
        alert("No accounts found in the connected wallet.");
        return;
      }

      setSelectedProvider(providerDetail);
      setAccounts(requestedAccounts);
      setSelectedAddress(requestedAccounts[0]);
    },
    [],
  );

  const discoverProviders = useCallback(async () => {
    try {
      const availableProviders = getEip6963Providers();
      if (availableProviders.length === 0) {
        alert("No EVM-compatible wallet found. Install an EIP-1193 wallet and try again.");
        return;
      }

      const options = toProviderOptions(availableProviders);
      setProviderOptions(options);

      if (availableProviders.length === 1) {
        await connectWithProvider(availableProviders[0]);
      }
    } catch {
      alert(
        "Failed to connect. Install an EVM-compatible wallet (EIP-1193) and try again.",
      );
    }
  }, [connectWithProvider]);

  const selectProvider = useCallback(
    async (uuid: string) => {
      const providerDetail = getEip6963Providers().find(
        (entry) => entry.info.uuid === uuid,
      );
      if (!providerDetail) return;
      await connectWithProvider(providerDetail);
    },
    [connectWithProvider],
  );

  const selectAccountByAddress = useCallback((address: string) => {
    setSelectedAddress(address);
  }, []);

  const disconnect = useCallback(() => {
    setAccounts([]);
    setSelectedAddress(undefined);
    setSelectedProvider(undefined);
    setProviderOptions([]);
  }, []);

  const getWalletClient = useCallback(
    (origin: string): WalletClient | undefined => {
      if (!selectedAddress || !selectedProvider) return undefined;
      if (!isAddress(selectedAddress)) {
        throw new Error("Selected EVM address is invalid.");
      }

      return createWalletClient({
        account: getAddress(selectedAddress),
        transport: custom(selectedProvider.provider),
        chain: getViemChainForOrigin(origin),
      });
    },
    [selectedAddress, selectedProvider],
  );

  const getConnectedWalletClient = useCallback(
    (origin: string): WalletClient | undefined => {
      if (!selectedProvider) return undefined;
      return createEvmWalletClient(origin, selectedProvider.provider);
    },
    [selectedProvider],
  );

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
