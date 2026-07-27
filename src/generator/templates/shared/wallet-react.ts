import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TWalletReactFragmentId = Extract<TFragmentId, `wallet/${string}.react`>;

export const createWalletReactFragments: TFragmentFactory<
  TWalletReactFragmentId
> = (context) => {
  const { projectKind, client, sdkPackage } = context;

  return {
    'wallet/SubstrateWalletControls.react':
      () => source`import type { FC } from "react";
        import type { TWalletControlsSubstrateProps } from "../../types";
        
        export const SubstrateWalletControls: FC<TWalletControlsSubstrateProps> = ({
          extensionNames,
          selectedExtensionName,
          accounts,
          selectedAddress,
          onConnectClick,
          onExtensionChange,
          onAccountChange,
        }) => (
          <>
            {extensionNames.length > 0 ? (
              <div>
                <h4>Select extension:</h4>
                <select
                  value={selectedExtensionName}
                  onChange={(e) => {
                    const name = e.target.value;
                    if (name) onExtensionChange(name);
                  }}
                >
                  <option disabled value="">
                    -- select an option --
                  </option>
                  {extensionNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
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
                  {accounts.map(({ name, address }) => (
                    <option key={address} value={address}>
                      {name} — {address}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        );
        `,
    'wallet/createWalletControls.react':
      () => source`import type { FC } from "react";
        import { EvmWalletControls } from "../evm/EvmWalletControls";
        import type {
          TUseWalletWithEvmReturn,
          TWalletControlsSubstrateProps,
        } from "../../types";
        
        export const createWalletControls = (
          SubstrateControls: FC<TWalletControlsSubstrateProps>,
        ) => {
          const WalletControls: FC<{ wallet: TUseWalletWithEvmReturn }> = ({
            wallet,
          }) => {
            if (wallet.activeWalletKind === "evm") {
              return (
                <EvmWalletControls
                  providerOptions={wallet.evmProviderOptions}
                  selectedProviderUuid={wallet.selectedEvmProviderUuid}
                  accounts={wallet.evmAccounts}
                  selectedAddress={wallet.selectedAddress}
                  onConnectClick={() => {
                    void wallet.discoverEvmProviders();
                  }}
                  onProviderChange={(uuid) => {
                    void wallet.selectEvmProvider(uuid);
                  }}
                  onAccountChange={wallet.selectEvmAccount}
                  onDisconnect={wallet.disconnectEvm}
                />
              );
            }
        
            return (
              <SubstrateControls
                extensionNames={wallet.extensionNames}
                selectedExtensionName={wallet.selectedExtensionName}
                accounts={wallet.accounts}
                selectedAddress={wallet.selectedAddress}
                onConnectClick={() => {
                  void wallet.discoverExtensions();
                }}
                onExtensionChange={(name) => {
                  void wallet.selectExtension(name);
                }}
                onAccountChange={wallet.selectAccountByAddress}
              />
            );
          };
        
          return WalletControls;
        };
        `,
    'wallet/useExtensionWallet.react':
      () => source`import { useCallback, useEffect, useMemo, useState } from "react";
        import {
          web3Accounts,
          web3Enable,
          web3FromAddress,
        } from "@polkadot/extension-dapp";
        import type { Signer } from "@polkadot/api/types";
        import type {
          TSubstrateWalletConnection,
          TWalletAccountOption,
        } from "../../types";
        
        const DAPP_ORIGIN = "ParaSpell XCM SDK";
        
        export const use${client === 'pjs' ? 'Pjs' : 'Dedot'}Wallet = () => {
          const [extensionNames, setExtensionNames] = useState<string[]>([]);
          const [selectedExtensionName, setSelectedExtensionName] = useState<string>();
          const [accounts, setAccounts] = useState<TWalletAccountOption[]>([]);
          const [selectedAddress, setSelectedAddress] = useState<string>();
          const [signer, setSigner] = useState<Signer | null>(null);
        
          const selectExtension = useCallback(async (name: string) => {
            await web3Enable(DAPP_ORIGIN);
            const filtered = await web3Accounts({ extensions: [name] });
            const nextAccounts = filtered.map(
              (account): TWalletAccountOption => ({
                address: account.address,
                name: account.meta.name,
              }),
            );
            setSelectedExtensionName(name);
            setAccounts(nextAccounts);
            if (nextAccounts[0]) {
              setSelectedAddress(nextAccounts[0].address);
            } else {
              setSelectedAddress(undefined);
            }
          }, []);
        
          const discoverExtensions = useCallback(async () => {
            const injected = await web3Enable(DAPP_ORIGIN);
            if (!injected.length) {
              alert(
                "No Polkadot{.js} extension responded. Install a compatible wallet.",
              );
              return;
            }
            const names = injected.map((e) => e.name);
            setExtensionNames(names);
            await selectExtension(names[0]);
          }, [selectExtension]);
        
          useEffect(() => {
            if (!selectedAddress) {
              return;
            }
            void web3Enable(DAPP_ORIGIN);
          }, [selectedAddress]);
        
          useEffect(() => {
            if (!selectedAddress) {
              return;
            }
            const abortController = new AbortController();
            void web3FromAddress(selectedAddress)
              .then((injector) => {
                if (abortController.signal.aborted) return;
                setSigner(injector.signer);
              })
              .catch(() => {
                if (!abortController.signal.aborted) setSigner(null);
              });
            return () => {
              abortController.abort();
              setSigner(null);
            };
          }, [selectedAddress]);
        
          const connection = useMemo((): TSubstrateWalletConnection<Signer> | null => {
            if (!selectedAddress || !signer) return null;
            return { address: selectedAddress, signer };
          }, [selectedAddress, signer]);
        
          const selectAccountByAddress = useCallback(
            (address: string) => {
              const acc = accounts.find((a) => a.address === address);
              if (acc) setSelectedAddress(acc.address);
            },
            [accounts],
          );
        
          return {
            extensionNames,
            selectedExtensionName,
            accounts,
            selectedAddress,
            connection,
            discoverExtensions,
            selectExtension,
            selectAccountByAddress,
          };
        };
        `,
    'wallet/usePapiWallet.react':
      () => source`import { useCallback, useMemo, useState } from "react";
        import {
          connectInjectedExtension,
          getInjectedExtensions,
          type InjectedPolkadotAccount,
        } from "polkadot-api/pjs-signer";
        import type { PolkadotSigner } from "polkadot-api";
        import type { TSubstrateWalletConnection } from "../../types";
        
        export const usePapiWallet = () => {
          const [extensionNames, setExtensionNames] = useState<string[]>([]);
          const [selectedExtensionName, setSelectedExtensionName] = useState<string>();
          const [accounts, setAccounts] = useState<InjectedPolkadotAccount[]>([]);
          const [selectedAccount, setSelectedAccount] =
            useState<InjectedPolkadotAccount>();
        
          const connection = useMemo((): TSubstrateWalletConnection<PolkadotSigner> | null => {
            if (!selectedAccount) return null;
            return {
              address: selectedAccount.address,
              signer: selectedAccount.polkadotSigner,
            };
          }, [selectedAccount]);
        
          const selectExtension = useCallback(async (name: string) => {
            const injected = await connectInjectedExtension(name);
            setSelectedExtensionName(name);
            const nextAccounts = injected.getAccounts();
            setAccounts(nextAccounts);
            if (nextAccounts.length > 0) setSelectedAccount(nextAccounts[0]);
            else setSelectedAccount(undefined);
          }, []);
        
          const discoverExtensions = useCallback(async () => {
            const names = getInjectedExtensions();
            if (names.length === 0) {
              alert("No wallet extension found, install it to connect");
              return;
            }
            setExtensionNames(names);
            await selectExtension(names[0]);
          }, [selectExtension]);
        
          const selectAccountByAddress = useCallback(
            (address: string) => {
              const acc = accounts.find((a) => a.address === address);
              if (acc) setSelectedAccount(acc);
            },
            [accounts],
          );
        
          return {
            extensionNames,
            selectedExtensionName,
            accounts,
            selectedAddress: selectedAccount?.address,
            connection,
            discoverExtensions,
            selectExtension,
            selectAccountByAddress,
          };
        };
        `,
    'wallet/useWalletWithEvm.api.react':
      () => source`import type { PolkadotSigner } from "polkadot-api";
        import type { TFormValues } from "../../types";
        import { useEvmOriginChains } from "../../evm/useEvmOriginChains";
        import { submitUsingApi } from "../../submit/submitUsingApi";
        import { createWalletControls } from "../shared/createWalletControls";
        import { connectWalletAlert } from "../shared/submitTransfer";
        import { useWalletWithEvmCore } from "../shared/useWalletWithEvmCore";
        import type { TUseWalletReturn } from "../../types";
        import { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
        import { usePapiWallet } from "./usePapiWallet";
        
        export const WalletControls = createWalletControls(SubstrateWalletControls);
        
        export const useWalletWithEvm = (): TUseWalletReturn => {
          const { ensureEvmOriginChains, isEvmOrigin } = useEvmOriginChains();
          const papi = usePapiWallet();
        
          const core = useWalletWithEvmCore<PolkadotSigner>({
            extensionNames: papi.extensionNames,
            selectedExtensionName: papi.selectedExtensionName,
            accounts: papi.accounts,
            selectedAddress: papi.selectedAddress,
            connection: papi.connection,
            discoverExtensions: papi.discoverExtensions,
            selectExtension: papi.selectExtension,
            selectAccountByAddress: papi.selectAccountByAddress,
          });
        
          const submitTransfer = async (formValues: TFormValues) => {
            const options = core.buildSubmitOptions(formValues.from);
            if (!options) {
              connectWalletAlert(core);
              return false;
            }

            await submitUsingApi(formValues, options, {
              ensureEvmOriginChains,
              isEvmOrigin,
            });
            return true;
          };
        
          return { ...core, submitTransfer };
        };
        `,
    'wallet/useWalletWithEvm.sdk.react': () => {
      const walletLabel =
        client === 'pjs' ? 'Pjs' : client === 'dedot' ? 'Dedot' : 'Papi';
      const signerType = client === 'papi' ? 'PolkadotSigner' : 'Signer';

      return source`
        ${
          client === 'papi'
            ? source`import type { PolkadotSigner } from "polkadot-api";
        `
            : source`import type { Signer } from "@polkadot/api/types";
        `
        }
        import type { TFormValues } from "../../types";
        import { submitUsingSdk } from "../../xcm/${client}";
        import { createWalletControls } from "../shared/createWalletControls";
        import {
          connectWalletAlert,
          submitEvmIfNeeded,
        } from "../shared/submitTransfer";
        import { useWalletWithEvmCore } from "../shared/useWalletWithEvmCore";
        import type { TUseWalletReturn } from "../../types";
        import { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
        import { use${walletLabel}Wallet } from "./use${walletLabel}Wallet";
        
        export const WalletControls = createWalletControls(SubstrateWalletControls);
        
        export const useWalletWithEvm = (): TUseWalletReturn => {
          const ${client} = use${walletLabel}Wallet();
        
          const core = useWalletWithEvmCore<${signerType}>({
            extensionNames: ${client}.extensionNames,
            selectedExtensionName: ${client}.selectedExtensionName,
            accounts: ${client}.accounts,
            selectedAddress: ${client}.selectedAddress,
            connection: ${client}.connection,
            discoverExtensions: ${client}.discoverExtensions,
            selectExtension: ${client}.selectExtension,
            selectAccountByAddress: ${client}.selectAccountByAddress,
          });
        
          const submitTransfer = async (formValues: TFormValues) => {
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
        `;
    },
    'wallet/useWalletWithEvmCore.react':
      () => source`import { useCallback, useEffect, useState } from "react";
        ${
          projectKind === 'sdk'
            ? source`import type { TChain } from "${sdkPackage}";
        `
            : ''
        }import { useEvmWallet } from "../evm/useEvmWallet";
        import type {
          TSubstrateWalletBase,
          TWalletKind,
          TWalletSubmitOptions,
        } from "../../types";
        
        export const useWalletWithEvmCore = <TSigner>(
          substrate: TSubstrateWalletBase<TSigner>,
        ) => {
          const evm = useEvmWallet();
          const {
            accounts,
            connection: substrateConnection,
            extensionNames,
            selectedAddress: substrateAddress,
            selectedExtensionName,
            selectExtension,
          } = substrate;
          const { getWalletClient, selectedProvider } = evm;
        
          const [activeWalletKind, setActiveWalletKind] =
            useState<TWalletKind>("substrate");
        
          useEffect(() => {
            if (activeWalletKind !== "substrate") return;
            if (accounts.length > 0) return;
            if (extensionNames.length === 0) return;
        
            const name = selectedExtensionName ?? extensionNames[0];
            void selectExtension(name).catch(() => undefined);
          }, [
            accounts.length,
            activeWalletKind,
            extensionNames,
            selectedExtensionName,
            selectExtension,
          ]);
        
          const buildSubmitOptions = useCallback(
            (from: ${projectKind === 'sdk' ? 'TChain' : 'string'}): TWalletSubmitOptions<TSigner> | null => {
              if (activeWalletKind === "evm") {
                const walletClient = getWalletClient(from);
                if (!walletClient || !selectedProvider) return null;
                return {
                  kind: "evm",
                  walletClient,
                  provider: selectedProvider.provider,
                };
              }
        
              if (!substrateConnection) return null;
              return {
                kind: "substrate",
                signer: substrateConnection.signer,
                senderAddress: substrateConnection.address,
              };
            },
            [activeWalletKind, getWalletClient, selectedProvider, substrateConnection],
          );
        
          return {
            ...substrate,
            connection:
              activeWalletKind === "substrate" ? substrateConnection : null,
            selectedAddress:
              activeWalletKind === "evm"
                ? evm.selectedAddress
                : substrateAddress,
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
          };
        };
        `,
  };
};
