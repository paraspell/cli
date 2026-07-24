import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TEvmCoreFragmentId = Exclude<
  Extract<TFragmentId, `evm/${string}`>,
  `evm/${string}.react` | `evm/${string}.vue`
>;

export const createEvmCoreFragments: TFragmentFactory<TEvmCoreFragmentId> = (
  context,
) => {
  const {
    sdkPackage,
    extensions: { evm, snowbridge },
  } = context;

  return {
    'evm/eip6963.ts':
      () => source`import { createStore, type EIP6963ProviderDetail } from "mipd";
        
        export const evmProviderStore =
          typeof window === "undefined" ? undefined : createStore();
        
        export const getEip6963Providers = (): readonly EIP6963ProviderDetail[] =>
          evmProviderStore?.getProviders() ?? [];
        `,
    'evm/evmOrigins.api.frontend': () => source`import axios from "axios";
        import { API_URL } from "../consts";
        
        export const loadEvmOriginChains = async (): Promise<readonly string[]> => {
          const response = await axios.get<string[]>(\`\${API_URL}/chains/evm\`);
          return response.data;
        };
        `,
    'evm/evmOrigins.api.node': () => source`import axios from "axios";
        import { API_URL } from "./consts.js";
        
        export const fetchEvmOriginChains = async (): Promise<readonly string[]> => {
          const response = await axios.get<string[]>(\`\${API_URL}/chains/evm\`);
          return response.data;
        };
        
        export const isEvmOrigin = (
          chain: string,
          evmOriginChains: readonly string[],
        ): boolean => evmOriginChains.includes(chain);
        `,
    'evm/evmWalletClient':
      () => source`import type { EIP1193Provider } from "mipd";
        import {
          createWalletClient,
          custom,
          type Address,
          type WalletClient,
        } from "viem";
        import { getViemChainForOrigin } from "./getViemChain";
        
        export const createEvmWalletClient = (
          origin: string,
          provider: EIP1193Provider,
        ): WalletClient =>
          createWalletClient({
            chain: getViemChainForOrigin(origin),
            transport: custom(provider),
          });
        
        export const ensureEvmWalletClient = async (
          walletClient: WalletClient,
          origin: string,
          provider: EIP1193Provider,
        ): Promise<WalletClient> => {
          if (!walletClient.account) {
            throw new Error(
              "EVM wallet has no account. Disconnect and connect again.",
            );
          }
          const address: Address = walletClient.account.address;
        
          return createWalletClient({
            account: address,
            chain: getViemChainForOrigin(origin),
            transport: custom(provider),
          });
        };
        `,
    'evm/getViemChain': () => source`import type { Chain } from "viem";${
      evm
        ? source`
        import { darwinia, moonbeam, moonriver } from "viem/chains";`
        : ''
    }${
      snowbridge
        ? source`
        import { mainnet } from "viem/chains";`
        : ''
    }
        
        const VIEM_CHAIN_BY_ORIGIN: Record<string, Chain> = {${
          evm
            ? source`
          Moonbeam: moonbeam,
          Moonriver: moonriver,
          Darwinia: darwinia,`
            : ''
        }${
          snowbridge
            ? source`
          Ethereum: mainnet,`
            : ''
        }
        };
        
        export const getViemChainForOrigin = (origin: string): Chain => {
          const chain = VIEM_CHAIN_BY_ORIGIN[origin];
          if (!chain) {
            throw new Error(\`No viem chain configured for origin: \${origin}\`);
          }
          return chain;
        };
        `,
    'evm/index.api':
      () => source`export { getEip6963Providers, evmProviderStore } from "./eip6963";
        export {
          createEvmWalletClient,
          ensureEvmWalletClient,
        } from "./evmWalletClient";
        export { useEvmOriginChains } from "./useEvmOriginChains";
        export { getViemChainForOrigin } from "./getViemChain";
        `,
    'evm/index.sdk': () => source`${
      evm
        ? source`export { EVM_ORIGIN_CHAINS } from "@paraspell/evm";
        `
        : ''
    }export { getEip6963Providers, evmProviderStore } from "./eip6963";
        export {
          createEvmWalletClient,
          ensureEvmWalletClient,
        } from "./evmWalletClient";
        export { getViemChainForOrigin } from "./getViemChain";
        export {
          assertSubstrateOrigin,
          isSubstrateOrigin,
        } from "./isEvmOrigin";
        `,
    'evm/isEvmOrigin.sdk': () => source`import {
          isChainEvm,
          type TChain,
          type TSubstrateChain,
        } from "${sdkPackage}";
        
        export const isSubstrateOrigin = (
          chain: TChain,
        ): chain is TSubstrateChain => !isChainEvm(chain);
        
        export const assertSubstrateOrigin: (
          chain: TChain,
        ) => asserts chain is TSubstrateChain = (chain) => {
          if (!isSubstrateOrigin(chain)) {
            throw new Error("EVM origins are submitted via the EVM wallet path.");
          }
        };
        `,
    'evm/utils.ts':
      () => source`import type { EIP6963ProviderDetail } from "mipd";
        import type { TEvmProviderOption } from "../types";
        
        export const truncateAddress = (address: string) =>
          \`\${address.slice(0, 6)}…\${address.slice(-4)}\`;
        
        export const toProviderOptions = (
          availableProviders: readonly EIP6963ProviderDetail[],
        ): TEvmProviderOption[] =>
          availableProviders.map((entry) => ({
            uuid: entry.info.uuid,
            label: entry.info.name,
          }));
        
        export const parseRequestedAccounts = (result: unknown): string[] => {
          if (!Array.isArray(result)) {
            throw new Error("Wallet returned an invalid accounts response.");
          }
          return result.filter((value): value is string => typeof value === "string");
        };
        `,
  };
};
