import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TTypesFragmentId = Extract<TFragmentId, `types/${string}`>;

export const createTypesFragments: TFragmentFactory<TTypesFragmentId> = (
  context,
  renderFragment,
) => {
  const {
    framework,
    projectKind,
    client,
    sdkPackage,
    extensions: { swap },
    evmWallet,
  } = context;

  return {
    'types/api.frontend': () => source`${
      evmWallet
        ? source`
        import type { PolkadotSigner } from "polkadot-api";
        ${
          framework === 'vue'
            ? source`
        import type { ComputedRef, Ref } from "vue";
        `
            : ''
        }
        import type { WalletClient } from "viem";
        `
        : ''
    }
        
        ${renderFragment('types/common')}
        ${renderFragment('types/api.shared')}
        
        export type TFormValues = {
          from: string;
          to: string;
          currency: TAssetInfo;
          recipient: string;
          amount: string;${
            swap
              ? source`
          swapEnabled?: boolean;
          currencyTo?: TAssetInfo;
          exchange?: string[];`
              : ''
          }
        };
        
        ${
          evmWallet
            ? source`
        export type TEvmOriginHelpers = {
          ensureEvmOriginChains: () => Promise<readonly string[]>;
          isEvmOrigin: (chain: string) => boolean;
        };
        
        ${renderFragment('types/wallet.evm')}
        `
            : ''
        }
        `,
    'types/api.node': () => source`${renderFragment('types/api.shared')}
        
        export type TTransferParams = {
          from: string;
          to: string;
          amount: string;
          currencyLocation?: object;
          recipient: string;${
            swap
              ? source`
          currencyToLocation?: object;
          exchange?: string[];`
              : ''
          }
        };
        `,
    'types/api.shared': () => source`export type TAssetInfo = {
          symbol: string;
          assetId?: string;
          location: object;
        };
        
        export type TApiParams = {
          from?: string;
          to?: string;
          currency: { location: object; amount: string };
          recipient: string;
          sender: string;${
            swap
              ? source`
          swapOptions?: {
            currencyTo: { location: object };
            exchange?: string[];
          };`
              : ''
          }
        };
        
        export type TApiTransaction = {
          type: string;
          chain: string;
          tx: string;
        };
        
        export type TApiErrorResponse = {
          message?: string;
        };
        `,
    'types/common': () => source`${
      evmWallet
        ? source`export type TWalletKind = "substrate" | "evm";
        
        export const WALLET_KIND_OPTIONS = [
          { value: "substrate", label: "Substrate" },
          { value: "evm", label: "EVM" },
        ] as const;
        
        export const parseWalletKind = (value: string): TWalletKind => {
          if (value !== "substrate" && value !== "evm") {
            throw new Error(\`Unsupported wallet kind: \${value}\`);
          }
          return value;
        };
        `
        : ''
    }
        ${
          framework === 'vue' || (projectKind === 'sdk' && client !== 'papi')
            ? 'export '
            : ''
        }type TWalletAccountOption = {
          address: string;
          name?: string;
        };${
          evmWallet
            ? source`
        
        export type TEvmAccountOption = {
          address: string;
          label: string;
        };
        
        export type TEvmProviderOption = {
          uuid: string;
          label: string;
        };`
            : ''
        }
        
        export type TSubstrateWalletConnection<TSigner> = {
          address: string;
          signer: TSigner;
        };
        
        ${
          framework === 'react'
            ? source`export type TWalletControlsSubstrateProps = {
          extensionNames: string[];
          selectedExtensionName: string | undefined;
          accounts: TWalletAccountOption[];
          selectedAddress: string | undefined;
          onConnectClick: () => void;
          onExtensionChange: (name: string) => void;
          onAccountChange: (address: string) => void;
        };
        `
            : ''
        }${
          evmWallet && framework === 'react'
            ? source`
        export type TWalletControlsEvmProps = {
          providerOptions: TEvmProviderOption[];
          selectedProviderUuid: string | undefined;
          accounts: TEvmAccountOption[];
          selectedAddress: string | undefined;
          onConnectClick: () => void;
          onProviderChange: (uuid: string) => void;
          onAccountChange: (address: string) => void;
          onDisconnect?: () => void;
        };`
            : ''
        }
        `,
    'types/sdk.frontend':
      () => source`import type { TAssetInfo, TChain${swap ? source`, TExchangeChain` : ''} } from "${sdkPackage}";
        ${
          client === 'papi' && evmWallet
            ? source`
        import type { PolkadotSigner } from "polkadot-api";
        `
            : ''
        }${
          (client === 'pjs' || client === 'dedot') && evmWallet
            ? source`
        import type { Signer } from "@polkadot/api/types";
        `
            : ''
        }${
          evmWallet
            ? source`${
                framework === 'vue'
                  ? source`
        import type { ComputedRef, Ref } from "vue";
        `
                  : ''
              }
        import type { WalletClient } from "viem";
        `
            : ''
        }
        
        ${renderFragment('types/common')}
        
        export type TFormValues = {
          from: TChain;
          to: TChain;
          recipient: string;
          amount: string;
          currency: TAssetInfo;${
            swap
              ? source`
          swapEnabled?: boolean;
          currencyTo?: TAssetInfo;
          exchange?: TExchangeChain[];`
              : ''
          }
        };
        
        ${
          evmWallet
            ? source`
        ${renderFragment('types/wallet.evm')}
        `
            : ''
        }
        `,
    'types/sdk.node':
      () => source`import type { TChain, TDestination, TLocation } from "${sdkPackage}";
        
        export type TTransferParams = {
          from: TChain;
          to: TDestination;
          amount: string;
          currencyLocation?: TLocation;
          recipient: string;
          ${swap ? source`currencyToLocation?: TLocation;` : ''}
        };
        `,
    'types/wallet.evm': () => source`export type TWalletKindSelectorProps = {
          activeWalletKind: ${framework === 'vue' ? 'Ref<TWalletKind>' : 'TWalletKind'};
          setActiveWalletKind: (kind: TWalletKind) => void;
        };
        
        export type TSubstrateWalletBase<TSigner> = {
          extensionNames: ${framework === 'vue' ? 'Ref<string[]>' : 'string[]'};
          selectedExtensionName: ${
            framework === 'vue'
              ? 'Ref<string | undefined>'
              : 'string | undefined'
          };
          accounts: ${
            framework === 'vue'
              ? 'Ref<TWalletAccountOption[]>'
              : 'TWalletAccountOption[]'
          };
          selectedAddress: ${
            framework === 'vue'
              ? 'Ref<string | undefined>'
              : 'string | undefined'
          };
          connection: ${
            framework === 'vue'
              ? 'Ref<TSubstrateWalletConnection<TSigner> | null>'
              : 'TSubstrateWalletConnection<TSigner> | null'
          };
          discoverExtensions: () => Promise<void>;
          selectExtension: (name: string) => Promise<void>;
          selectAccountByAddress: (address: string) => void;
        };
        
        export type TWalletSubmitOptions<TSigner = unknown> =
          | { kind: "evm"; walletClient: WalletClient }
          | { kind: "substrate"; signer: TSigner; senderAddress: string };
        
        export type TUseWalletWithEvmReturn<TSigner = unknown> = TSubstrateWalletBase<TSigner> & {
          activeWalletKind: ${framework === 'vue' ? 'Ref<TWalletKind>' : 'TWalletKind'};
          setActiveWalletKind: (kind: TWalletKind) => void;
          buildSubmitOptions: (
            from: ${projectKind === 'sdk' ? 'TChain' : 'string'},
          ) => TWalletSubmitOptions<TSigner> | null;
          submitTransfer: (formValues: TFormValues) => Promise<boolean>;
          evmAccounts: ${
            framework === 'vue'
              ? 'ComputedRef<TEvmAccountOption[]>'
              : 'TEvmAccountOption[]'
          };
          evmProviderOptions: ${
            framework === 'vue'
              ? 'Ref<TEvmProviderOption[]>'
              : 'TEvmProviderOption[]'
          };
          selectedEvmProviderUuid: ${
            framework === 'vue'
              ? 'ComputedRef<string | undefined>'
              : 'string | undefined'
          };
          discoverEvmProviders: () => Promise<void>;
          selectEvmProvider: (uuid: string) => Promise<void>;
          selectEvmAccount: (address: string) => void;
          disconnectEvm: () => void;
        };
        
        export type TUseWalletReturn = TUseWalletWithEvmReturn<${client === 'papi' ? 'PolkadotSigner' : 'Signer'}>;
        `,
  };
};
