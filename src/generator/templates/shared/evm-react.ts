import type { FragmentFactory, FragmentId } from "./contracts.js";
import { source } from "../source.js";

type EvmReactFragmentId = Extract<FragmentId, `evm/${string}.react`>;

export const createEvmReactFragments: FragmentFactory<
  EvmReactFragmentId
> = () => {
  return {
    "evm/EvmWalletControls.react": () => source`import type { FC } from "react";
        import type { WalletControlsEvmProps } from "../../types";
        
        export const EvmWalletControls: FC<WalletControlsEvmProps> = ({
          providerOptions,
          selectedProviderUuid,
          accounts,
          selectedAddress,
          onConnectClick,
          onProviderChange,
          onAccountChange,
          onDisconnect,
        }) => (
          <>
            {providerOptions.length > 0 ? (
              <div>
                <h4>Select provider:</h4>
                <select
                  value={selectedProviderUuid ?? ""}
                  onChange={(e) => {
                    const uuid = e.target.value;
                    if (uuid) onProviderChange(uuid);
                  }}
                >
                  <option disabled value="">
                    -- select an option --
                  </option>
                  {providerOptions.map(({ uuid, label }) => (
                    <option key={uuid} value={uuid}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button type="button" onClick={onConnectClick}>
                Connect Wallet
              </button>
            )}
            {accounts.length > 0 && (
              <div>
                <h4>Select account:</h4>
                <select
                  value={selectedAddress}
                  onChange={(e) => onAccountChange(e.target.value)}
                >
                  {accounts.map(({ label, address }) => (
                    <option key={address} value={address}>
                      {label} — {address}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedAddress && onDisconnect && (
              <button type="button" className="secondary" onClick={onDisconnect}>
                Disconnect
              </button>
            )}
          </>
        );
        `,
    "evm/WalletKindSelector.react":
      () => source`import type { FC } from "react";
        import {
          parseWalletKind,
          WALLET_KIND_OPTIONS,
          type WalletKindSelectorProps,
        } from "../../types";
        
        export const WalletKindSelector: FC<WalletKindSelectorProps> = ({
          activeWalletKind,
          setActiveWalletKind,
        }) => (
          <div>
            <h4>Select wallet type:</h4>
            <select
              value={activeWalletKind}
              onChange={(event) =>
                setActiveWalletKind(parseWalletKind(event.currentTarget.value))
              }
            >
              {WALLET_KIND_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        );
        `,
    "evm/useEvmOriginChains.react":
      () => source`import { useCallback, useEffect, useRef, useState } from "react";
        import { loadEvmOriginChains } from "./evmOrigins";
        
        export const useEvmOriginChains = () => {
          const [chains, setChains] = useState<readonly string[]>([]);
          const fetchPromiseRef = useRef<Promise<readonly string[]> | null>(null);
        
          const ensureEvmOriginChains = useCallback(async (): Promise<readonly string[]> => {
            if (chains.length > 0) {
              return chains;
            }
        
            fetchPromiseRef.current ??= loadEvmOriginChains();
            try {
              const result = await fetchPromiseRef.current;
              setChains(result);
              return result;
            } finally {
              fetchPromiseRef.current = null;
            }
          }, [chains]);
        
          useEffect(() => {
            void ensureEvmOriginChains();
          }, [ensureEvmOriginChains]);
        
          const isEvmOrigin = useCallback(
            (chain: string) => chains.includes(chain),
            [chains],
          );
        
          return { chains, isEvmOrigin, ensureEvmOriginChains };
        };
        `,
    "evm/useEvmWallet.react":
      () => source`import { useCallback, useEffect, useMemo, useState } from "react";
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
        `,
  };
};
