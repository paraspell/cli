import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TEvmVueFragmentId = Extract<TFragmentId, `evm/${string}.vue`>;

export const createEvmVueFragments: TFragmentFactory<
  TEvmVueFragmentId
> = () => {
  return {
    'evm/EvmWalletControls.vue': () => source`<script setup lang="ts">
        import type { TEvmAccountOption, TEvmProviderOption } from "../types";
        
        defineProps<{
          providerOptions: TEvmProviderOption[];
          selectedProviderUuid: string | undefined;
          accounts: TEvmAccountOption[];
          selectedAddress: string | undefined;
        }>();
        
        const emit = defineEmits<{
          connectClick: [];
          providerChange: [uuid: string];
          accountChange: [address: string];
          disconnect: [];
        }>();
        
        const onProviderChange = (event: Event) => {
          const target = event.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          const uuid = target.value;
          if (uuid) emit("providerChange", uuid);
        };
        
        const onAccountChange = (event: Event) => {
          const target = event.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          emit("accountChange", target.value);
        };
        </script>
        
        <template>
          <div v-if="providerOptions.length > 0">
            <h4>Select provider:</h4>
            <select
              :value="selectedProviderUuid ?? ''"
              @change="onProviderChange"
            >
              <option disabled value="">
                -- select an option --
              </option>
              <option
                v-for="{ uuid, label } in providerOptions"
                :key="uuid"
                :value="uuid"
              >
                {{ label }}
              </option>
            </select>
          </div>
          <button
            v-else
            type="button"
            @click="emit('connectClick')"
          >
            Connect Wallet
          </button>
        
          <div v-if="accounts.length > 0">
            <h4>Select account:</h4>
            <select
              :value="selectedAddress"
              @change="onAccountChange"
            >
              <option
                v-for="{ label, address } in accounts"
                :key="address"
                :value="address"
              >
                {{ label }} — {{ address }}
              </option>
            </select>
          </div>
          <button
            v-if="selectedAddress"
            type="button"
            class="secondary"
            @click="emit('disconnect')"
          >
            Disconnect
          </button>
        </template>
        `,
    'evm/WalletKindSelector.vue': () => source`<script setup lang="ts">
        import { parseWalletKind, WALLET_KIND_OPTIONS } from "../types";
        import type { TWalletKind } from "../types";
        
        defineProps<{
          activeWalletKind: TWalletKind;
        }>();
        
        const emit = defineEmits<{
          "update:activeWalletKind": [kind: TWalletKind];
        }>();
        
        const onWalletKindChange = (event: Event) => {
          const target = event.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          emit("update:activeWalletKind", parseWalletKind(target.value));
        };
        </script>
        
        <template>
          <div>
            <h4>Select wallet type:</h4>
            <select :value="activeWalletKind" @change="onWalletKindChange">
              <option
                v-for="{ value, label } in WALLET_KIND_OPTIONS"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </div>
        </template>
        `,
    'evm/useEvmOriginChains.vue':
      () => source`import { onMounted, ref, shallowRef } from "vue";
        import { loadEvmOriginChains } from "../evm/evmOrigins";
        
        export const useEvmOriginChains = () => {
          const chains = ref<readonly string[]>([]);
          const fetchPromise = shallowRef<Promise<readonly string[]> | null>(null);
        
          const ensureEvmOriginChains = async (): Promise<readonly string[]> => {
            if (chains.value.length > 0) {
              return chains.value;
            }
        
            fetchPromise.value ??= loadEvmOriginChains();
            try {
              const result = await fetchPromise.value;
              chains.value = result;
              return result;
            } finally {
              fetchPromise.value = null;
            }
          };
        
          const isEvmOrigin = (chain: string) => chains.value.includes(chain);
        
          onMounted(() => {
            void ensureEvmOriginChains().catch(() => undefined);
          });
        
          return { chains, isEvmOrigin, ensureEvmOriginChains };
        };
        `,
    'evm/useEvmWallet.vue': () => source`import { computed, ref } from "vue";
        import type { EIP6963ProviderDetail } from "mipd";
        import { getAddress, type WalletClient, isAddress } from "viem";
        import { createWalletClient, custom } from "viem";
        import { getEip6963Providers } from "../evm/eip6963";
        import { getViemChainForOrigin } from "../evm/getViemChain";
        import {
          parseRequestedAccounts,
          toProviderOptions,
          truncateAddress,
        } from "../evm/utils";
        import type { TEvmAccountOption, TEvmProviderOption } from "../types";
        
        export const useEvmWallet = () => {
          const accounts = ref<string[]>([]);
          const selectedAddress = ref<string>();
          const selectedProvider = ref<EIP6963ProviderDetail>();
          const providerOptions = ref<TEvmProviderOption[]>([]);
        
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
        
          const accountOptions = computed((): TEvmAccountOption[] =>
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
