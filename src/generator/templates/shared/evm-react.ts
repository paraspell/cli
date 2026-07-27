import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TEvmReactFragmentId = Extract<TFragmentId, `evm/${string}.react`>;

export const createEvmReactFragments: TFragmentFactory<
  TEvmReactFragmentId
> = () => {
  return {
    'evm/EvmWalletControls.react': () => source`import type { FC } from "react";
        import type { TWalletControlsEvmProps } from "../types";
        
        export const EvmWalletControls: FC<TWalletControlsEvmProps> = ({
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
    'evm/WalletKindSelector.react':
      () => source`import type { FC } from "react";
        import {
          parseWalletKind,
          WALLET_KIND_OPTIONS,
          type TWalletKindSelectorProps,
        } from "../types";
        
        export const WalletKindSelector: FC<TWalletKindSelectorProps> = ({
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
    'evm/useEvmOriginChains.react':
      () => source`import { useCallback, useEffect, useRef, useState } from "react";
        import { loadEvmOriginChains } from "../evm/evmOrigins";
        
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
            void ensureEvmOriginChains().catch(() => undefined);
          }, [ensureEvmOriginChains]);
        
          const isEvmOrigin = useCallback(
            (chain: string) => chains.includes(chain),
            [chains],
          );
        
          return { chains, isEvmOrigin, ensureEvmOriginChains };
        };
        `,
    'evm/useEvmWallet.react':
      () => source`import { useCallback, useEffect, useMemo, useState } from "react";
        import type { EIP6963ProviderDetail } from "mipd";
        import { getAddress, type WalletClient } from "viem";
        import { createWalletClient, custom, isAddress } from "viem";
        import { getEip6963Providers } from "../evm/eip6963";
        import { getViemChainForOrigin } from "../evm/getViemChain";
        import {
          parseRequestedAccounts,
          toProviderOptions,
          truncateAddress,
        } from "../evm/utils";
        import type { TEvmAccountOption, TEvmProviderOption } from "../types";
        
        export const useEvmWallet = () => {
          const [accounts, setAccounts] = useState<string[]>([]);
          const [selectedAddress, setSelectedAddress] = useState<string>();
          const [selectedProvider, setSelectedProvider] =
            useState<EIP6963ProviderDetail>();
          const [providerOptions, setProviderOptions] = useState<TEvmProviderOption[]>(
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
        
          const accountOptions = useMemo((): TEvmAccountOption[] => {
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
        
          return {
            accounts: accountOptions,
            providerOptions,
            selectedAddress,
            selectedProvider,
            selectedProviderUuid,
            discoverProviders,
            selectProvider,
            selectAccountByAddress,
            disconnect,
            getWalletClient,
          };
        };
        `,
  };
};
