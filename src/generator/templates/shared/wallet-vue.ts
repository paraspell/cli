import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TWalletVueFragmentId = Extract<TFragmentId, `wallet/${string}.vue`>;

export const createWalletVueFragments: TFragmentFactory<
  TWalletVueFragmentId
> = (context) => {
  const { projectKind, clientName, sdkPackage } = context;

  return {
    'wallet/SubstrateWalletControls.vue': () => source`<script setup lang="ts">
        import type { TWalletAccountOption } from "../types";
        
        defineProps<{
          extensionNames: string[];
          accounts: TWalletAccountOption[];
        }>();
        
        const selectedExtensionName = defineModel<string>(
          "selectedExtensionName",
          { default: "" },
        );
        const selectedAddress = defineModel<string>("selectedAddress", {
          default: "",
        });

        const emit = defineEmits<{
          connectClick: [];
        }>();
        </script>
        
        <template>
          <div v-if="extensionNames.length > 0">
            <h4>Select extension:</h4>
            <select v-model="selectedExtensionName">
              <option
                disabled
                value=""
              >
                -- select an option --
              </option>
              <option
                v-for="name in extensionNames"
                :key="name"
                :value="name"
              >
                {{ name }}
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
            <select v-model="selectedAddress">
              <option
                v-for="{ name, address } in accounts"
                :key="address"
                :value="address"
              >
                {{ name ?? "Account" }} — {{ address }}
              </option>
            </select>
          </div>
        </template>
        `,
    'wallet/WalletControls.vue': () => source`<script setup lang="ts">
        import { unref } from "vue";
        import EvmWalletControls from "./EvmWalletControls.vue";
        import SubstrateWalletControls from "./SubstrateWalletControls.vue";
        import type { TUseWalletWithEvmReturn } from "../types";

        defineProps<{
          wallet: TUseWalletWithEvmReturn;
        }>();
        </script>

        <template>
          <EvmWalletControls
            v-if="unref(wallet.activeWalletKind) === 'evm'"
            :provider-options="unref(wallet.evmProviderOptions)"
            :selected-provider-uuid="unref(wallet.selectedEvmProviderUuid)"
            :accounts="unref(wallet.evmAccounts)"
            :selected-address="unref(wallet.selectedAddress)"
            @connect-click="wallet.discoverEvmProviders"
            @update:selected-provider-uuid="wallet.selectEvmProvider"
            @update:selected-address="wallet.selectEvmAccount"
            @disconnect="wallet.disconnectEvm"
          />
          <SubstrateWalletControls
            v-else
            :extension-names="unref(wallet.extensionNames)"
            :selected-extension-name="unref(wallet.selectedExtensionName)"
            :accounts="unref(wallet.accounts)"
            :selected-address="unref(wallet.selectedAddress)"
            @connect-click="wallet.discoverExtensions"
            @update:selected-extension-name="wallet.selectExtension"
            @update:selected-address="wallet.selectAccountByAddress"
          />
        </template>
        `,
    'wallet/useExtensionWallet.vue':
      () => source`import { computed, ref, watch } from "vue";
        import {
          web3Accounts,
          web3Enable,
          web3FromAddress,
        } from "@polkadot/extension-dapp";
        import type { Signer } from "@polkadot/api/types";
        import type {
          TSubstrateWalletConnection,
          TWalletAccountOption,
        } from "../types";
        
        const DAPP_ORIGIN = "ParaSpell XCM SDK";
        
        export const use${clientName}Wallet = () => {
          const extensionNames = ref<string[]>([]);
          const selectedExtensionName = ref<string>();
          const accounts = ref<TWalletAccountOption[]>([]);
          const selectedAddress = ref<string>();
          const signer = ref<Signer | null>(null);
        
          const selectExtension = async (name: string) => {
            await web3Enable(DAPP_ORIGIN);
            const filtered = await web3Accounts({ extensions: [name] });
            const nextAccounts = filtered.map(
              (account): TWalletAccountOption => ({
                address: account.address,
                name: account.meta.name,
              }),
            );
            selectedExtensionName.value = name;
            accounts.value = nextAccounts;
            selectedAddress.value = nextAccounts[0]?.address;
          };
        
          const discoverExtensions = async () => {
            const injected = await web3Enable(DAPP_ORIGIN);
            if (!injected.length) {
              alert(
                "No Polkadot{.js} extension responded. Install a compatible wallet.",
              );
              return;
            }
            const names = injected.map((e) => e.name);
            extensionNames.value = names;
            await selectExtension(names[0]);
          };
        
          watch(
            selectedAddress,
            (address, _, onCleanup) => {
              if (!address) return;
              const abortController = new AbortController();
              onCleanup(() => {
                abortController.abort();
                signer.value = null;
              });
              void web3FromAddress(address)
                .then((injector) => {
                  if (!abortController.signal.aborted) {
                    signer.value = injector.signer;
                  }
                })
                .catch(() => {
                  if (!abortController.signal.aborted) signer.value = null;
                });
            },
            { immediate: true },
          );
        
          const connection = computed((): TSubstrateWalletConnection<Signer> | null => {
            if (!selectedAddress.value || !signer.value) return null;
            return { address: selectedAddress.value, signer: signer.value };
          });
        
          const selectAccountByAddress = (address: string) => {
            const acc = accounts.value.find((a) => a.address === address);
            if (acc) selectedAddress.value = acc.address;
          };
        
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
    'wallet/usePapiWallet.vue':
      () => source`import { computed, ref } from "vue";
        import {
          connectInjectedExtension,
          getInjectedExtensions,
          type InjectedPolkadotAccount,
        } from "polkadot-api/pjs-signer";
        import type { PolkadotSigner } from "polkadot-api";
        import type { TSubstrateWalletConnection } from "../types";
        
        export const usePapiWallet = () => {
          const extensionNames = ref<string[]>([]);
          const selectedExtensionName = ref<string>();
          const accounts = ref<InjectedPolkadotAccount[]>([]);
          const selectedAccount = ref<InjectedPolkadotAccount>();
          const selectedAddress = computed(() => selectedAccount.value?.address);
        
          const connection = computed((): TSubstrateWalletConnection<PolkadotSigner> | null => {
            if (!selectedAccount.value) return null;
            return {
              address: selectedAccount.value.address,
              signer: selectedAccount.value.polkadotSigner,
            };
          });
        
          const selectExtension = async (name: string) => {
            const injected = await connectInjectedExtension(name);
            selectedExtensionName.value = name;
            const nextAccounts = injected.getAccounts();
            accounts.value = nextAccounts;
            selectedAccount.value = nextAccounts[0];
          };
        
          const discoverExtensions = async () => {
            const names = getInjectedExtensions();
            if (names.length === 0) {
              alert("No wallet extension found, install it to connect");
              return;
            }
            extensionNames.value = names;
            await selectExtension(names[0]);
          };
        
          const selectAccountByAddress = (address: string) => {
            const acc = accounts.value.find((a) => a.address === address);
            if (acc) {
              selectedAccount.value = acc;
            }
          };
        
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
    'wallet/useWalletWithEvmCore.vue':
      () => source`import { computed, ref, unref, watch } from "vue";
        ${
          projectKind === 'sdk'
            ? source`import type { TChain } from "${sdkPackage}";
        `
            : ''
        }import { useEvmWallet } from "./useEvmWallet";
        import type {
          TSubstrateWalletBase,
          TWalletKind,
          TWalletSubmitOptions,
        } from "../types";
        
        export const useWalletWithEvmCore = <TSigner>(
          substrate: TSubstrateWalletBase<TSigner>,
        ) => {
          const evm = useEvmWallet();
          const activeWalletKind = ref<TWalletKind>("substrate");
        
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
              void substrate.selectExtension(name).catch(() => undefined);
            },
            { immediate: true },
          );
        
          const buildSubmitOptions = (
            from: ${projectKind === 'sdk' ? 'TChain' : 'string'},
          ): TWalletSubmitOptions<TSigner> | null => {
            if (activeWalletKind.value === "evm") {
              const walletClient = evm.getWalletClient(from);
              if (!walletClient) return null;
              return {
                kind: "evm",
                walletClient,
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
        
          const setActiveWalletKind = (kind: TWalletKind) => {
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
          };
        };
        `,
  };
};
