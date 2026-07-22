import type { FragmentFactory, FragmentId } from "./contracts.js";
import { source } from "../source.js";

type TypesFragmentId = Extract<FragmentId, `types/${string}`>;

export const createTypesFragments: FragmentFactory<TypesFragmentId> = (
  context,
  renderFragment,
) => {
  const { framework, projectKind, client, sdkPackage, swap, evmWallet } =
    context;

  return {
    "types/api.frontend": () => source`${
      evmWallet
        ? source`
        import type { PolkadotSigner } from "polkadot-api";
        ${
          framework === "vue"
            ? source`
        import type { ComputedRef, Ref } from "vue";
        `
            : ""
        }
        import type { WalletClient } from "viem";
        import type { EIP1193Provider } from "mipd";
        `
        : ""
    }
        
        ${renderFragment("types/common")}
        ${renderFragment("types/api.shared")}
        
        export type FormValues = {
          from: string;
          to: string;
          currency: AssetInfo;
          recipient: string;
          amount: string;${
            swap
              ? source`
          swapEnabled?: boolean;
          currencyTo?: AssetInfo;
          exchange?: string[];`
              : ""
          }
        };
        
        ${
          evmWallet
            ? source`
        export type EvmOriginHelpers = {
          ensureEvmOriginChains: () => Promise<readonly string[]>;
          isEvmOrigin: (chain: string) => boolean;
        };
        
        ${renderFragment("types/wallet.evm")}
        `
            : ""
        }
        `,
    "types/api.node": () => source`${renderFragment("types/api.shared")}
        
        export type TransferParams = {
          from: string;
          to: string;
          amount: string;
          currencyLocation?: object;
          recipient: string;
          currencyToLocation?: object;
          exchange?: string[];
        };
        `,
    "types/api.shared": () => source`export type AssetInfo = {
          symbol?: string;
          assetId?: string;
          location: object;
        };
        
        export type ApiParams = {
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
              : ""
          }
        };
        
        export type ApiTransaction = {
          type: string;
          chain: string;
          tx: string;
        };
        
        export type ApiErrorResponse = {
          message?: string;
        };
        `,
    "types/common": () => source`export type WalletKind = "substrate" | "evm";
        
        export type WalletKindOption = {
          value: WalletKind;
          label: string;
        };
        
        export const WALLET_KIND_OPTIONS: readonly WalletKindOption[] = [
          { value: "substrate", label: "Substrate" },
          { value: "evm", label: "EVM" },
        ];
        
        export const parseWalletKind = (value: string): WalletKind => {
          const option = WALLET_KIND_OPTIONS.find((item) => item.value === value);
          if (!option) {
            throw new Error(\`Unsupported wallet kind: \${value}\`);
          }
          return option.value;
        };
        
        export type WalletAccountOption = {
          address: string;
          name?: string;
        };
        
        export type EvmAccountOption = {
          address: string;
          label: string;
        };
        
        export type EvmProviderOption = {
          uuid: string;
          label: string;
        };
        
        export type SubstrateWalletConnection<TSigner> = {
          address: string;
          signer: TSigner;
        };
        
        export type WalletControlsSubstrateProps = {
          extensionNames: string[];
          selectedExtensionName: string | undefined;
          accounts: WalletAccountOption[];
          selectedAddress: string | undefined;
          onConnectClick: () => void;
          onExtensionChange: (name: string) => void;
          onAccountChange: (address: string) => void;
        };
        
        export type WalletControlsEvmProps = {
          providerOptions: EvmProviderOption[];
          selectedProviderUuid: string | undefined;
          accounts: EvmAccountOption[];
          selectedAddress: string | undefined;
          onConnectClick: () => void;
          onProviderChange: (uuid: string) => void;
          onAccountChange: (address: string) => void;
          onDisconnect?: () => void;
        };
        `,
    "types/sdk.frontend":
      () => source`import type { TAssetInfo, TChain${swap ? source`, TExchangeChain` : ""} } from "${sdkPackage}";
        ${
          client === "papi" && evmWallet
            ? source`
        import type { PolkadotSigner } from "polkadot-api";
        `
            : ""
        }${
          (client === "pjs" || client === "dedot") && evmWallet
            ? source`
        import type { Signer } from "@polkadot/api/types";
        `
            : ""
        }${
          evmWallet
            ? source`${
                framework === "vue"
                  ? source`
        import type { ComputedRef, Ref } from "vue";
        `
                  : ""
              }
        import type { WalletClient } from "viem";
        import type { EIP1193Provider } from "mipd";
        `
            : ""
        }
        
        ${renderFragment("types/common")}
        
        export type FormValues = {
          from: TChain;
          to: TChain;
          currencyOptionId: string;
          recipient: string;
          amount: string;
          currency: TAssetInfo;${
            swap
              ? source`
          swapEnabled?: boolean;
          currencyTo?: TAssetInfo;
          exchange?: TExchangeChain[];`
              : ""
          }
        };
        
        ${
          evmWallet
            ? source`
        ${renderFragment("types/wallet.evm")}
        `
            : ""
        }
        `,
    "types/sdk.node":
      () => source`import type { TChain, TDestination, TLocation, TSubstrateChain } from "${sdkPackage}";
        
        export type TransferParams = {
          from: TChain;
          to: TDestination;
          amount: string;
          currencyLocation?: TLocation;
          recipient: string;
          currencyToLocation?: TLocation;
        };
        `,
    "types/wallet.evm": () => source`export type WalletKindSelectorProps = {
          activeWalletKind: ${framework === "vue" ? "Ref<WalletKind>" : "WalletKind"};
          setActiveWalletKind: (kind: WalletKind) => void;
        };
        
        export type SubstrateWalletBase<TSigner> = {
          extensionNames: ${framework === "vue" ? "Ref<string[]> | string[]" : "string[]"};
          selectedExtensionName: ${
            framework === "vue"
              ? "Ref<string | undefined> | string | undefined"
              : "string | undefined"
          };
          accounts: ${
            framework === "vue"
              ? "Ref<WalletAccountOption[]> | WalletAccountOption[]"
              : "WalletAccountOption[]"
          };
          selectedAddress: ${
            framework === "vue"
              ? "Ref<string | undefined> | string | undefined"
              : "string | undefined"
          };
          connection: ${
            framework === "vue"
              ? "Ref<SubstrateWalletConnection<TSigner> | null> | SubstrateWalletConnection<TSigner> | null"
              : "SubstrateWalletConnection<TSigner> | null"
          };
          discoverExtensions: () => Promise<void>;
          selectExtension: (name: string) => Promise<void>;
          selectAccountByAddress: (address: string) => void;
        };
        
        export type WalletSubmitOptions<TSigner = unknown> =
          | { kind: "evm"; walletClient: WalletClient; provider: EIP1193Provider }
          | { kind: "substrate"; signer: TSigner; senderAddress: string };
        
        export type UseWalletWithEvmReturn<TSigner = unknown> = SubstrateWalletBase<TSigner> & {
          activeWalletKind: ${framework === "vue" ? "Ref<WalletKind>" : "WalletKind"};
          setActiveWalletKind: (kind: WalletKind) => void;
          buildSubmitOptions: (
            from: ${projectKind === "sdk" ? "TChain" : "string"},
          ) => WalletSubmitOptions<TSigner> | null;
          submitTransfer: (formValues: FormValues) => Promise<boolean>;
          evmAccounts: ${
            framework === "vue"
              ? "ComputedRef<EvmAccountOption[]>"
              : "EvmAccountOption[]"
          };
          evmProviderOptions: ${
            framework === "vue"
              ? "Ref<EvmProviderOption[]> | EvmProviderOption[]"
              : "EvmProviderOption[]"
          };
          selectedEvmProviderUuid: ${
            framework === "vue"
              ? "ComputedRef<string | undefined> | string | undefined"
              : "string | undefined"
          };
          discoverEvmProviders: () => Promise<void>;
          selectEvmProvider: (uuid: string) => Promise<void>;
          selectEvmAccount: (address: string) => void;
          disconnectEvm: () => void;
          getEvmWalletClient: (
            origin: ${projectKind === "sdk" ? "TChain" : "string"},
          ) => WalletClient | undefined;
        };
        
        export type UseWalletReturn = UseWalletWithEvmReturn<${client === "papi" ? "PolkadotSigner" : "Signer"}>;
        `,
  };
};
