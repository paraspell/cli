import type { FragmentFactory, FragmentId } from "./contracts.js";
import { source } from "../source.js";

type WalletVueFragmentId = Extract<FragmentId, `wallet/${string}.vue`>;

export const createWalletVueFragments: FragmentFactory<WalletVueFragmentId> = (
  context,
) => {
  const { projectKind, client, sdkPackage } = context;

  return {
    "wallet/SubstrateWalletControls.vue": () => source`<script setup lang="ts">
        import type { WalletAccountOption } from "../../types";
        
        defineProps<{
          extensionNames: string[];
          selectedExtensionName: string | undefined;
          accounts: WalletAccountOption[];
          selectedAddress: string | undefined;
        }>();
        
        const emit = defineEmits<{
          connectClick: [];
          extensionChange: [name: string];
          accountChange: [address: string];
        }>();
        
        const onExtensionChange = (event: Event) => {
          const target = event.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          const name = target.value;
          if (name) emit("extensionChange", name);
        };
        
        const onAccountChange = (event: Event) => {
          const target = event.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          emit("accountChange", target.value);
        };
        </script>
        
        <template>
          <div v-if="extensionNames.length > 0">
            <h4>Select extension:</h4>
            <select
              :value="selectedExtensionName"
              @change="onExtensionChange"
            >
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
            <select
              :value="selectedAddress"
              @change="onAccountChange"
            >
              <option
                v-for="{ name, address } in accounts"
                :key="address"
                :value="address"
              >
                {{ name }} — {{ address }}
              </option>
            </select>
          </div>
        </template>
        `,
    "wallet/createWalletControls.vue":
      () => source`import { defineComponent, h, unref, type Component } from "vue";
        import EvmWalletControls from "../evm/EvmWalletControls.vue";
        import type {
          UseWalletWithEvmReturn,
          WalletControlsSubstrateProps,
        } from "../../types";
        
        export const createWalletControls = (SubstrateControls: Component) =>
          defineComponent(
            (props: { wallet: UseWalletWithEvmReturn }) => {
              return () => {
                const wallet = props.wallet;
                if (unref(wallet.activeWalletKind) === "evm") {
                  return h(EvmWalletControls, {
                    providerOptions: unref(wallet.evmProviderOptions),
                    selectedProviderUuid: unref(wallet.selectedEvmProviderUuid),
                    accounts: unref(wallet.evmAccounts),
                    selectedAddress: unref(wallet.selectedAddress),
                    onConnectClick: () => {
                      void wallet.discoverEvmProviders();
                    },
                    onProviderChange: (uuid: string) => {
                      void wallet.selectEvmProvider(uuid);
                    },
                    onAccountChange: wallet.selectEvmAccount,
                    onDisconnect: wallet.disconnectEvm,
                  });
                }
        
                const substrateProps: WalletControlsSubstrateProps = {
                  extensionNames: unref(wallet.extensionNames),
                  selectedExtensionName: unref(wallet.selectedExtensionName),
                  accounts: unref(wallet.accounts),
                  selectedAddress: unref(wallet.selectedAddress),
                  onConnectClick: () => {
                    void wallet.discoverExtensions();
                  },
                  onExtensionChange: (name: string) => {
                    void wallet.selectExtension(name);
                  },
                  onAccountChange: wallet.selectAccountByAddress,
                };
        
                return h(SubstrateControls, substrateProps);
              };
            },
            {
              name: "WalletControls",
              props: {
                wallet: {
                  type: Object,
                  required: true,
                },
              },
            },
          );
        `,
    "wallet/useExtensionWallet.vue":
      () => source`import { computed, ref, watch } from "vue";
        import {
          web3Accounts,
          web3Enable,
          web3FromAddress,
        } from "@polkadot/extension-dapp";
        import type { Signer } from "@polkadot/api/types";
        import type {
          SubstrateWalletConnection,
          WalletAccountOption,
        } from "../../types";
        
        const DAPP_ORIGIN = "ParaSpell XCM SDK";
        
        export const use${client === "pjs" ? "Pjs" : "Dedot"}Wallet = () => {
          const extensionNames = ref<string[]>([]);
          const selectedExtensionName = ref<string>();
          const accounts = ref<WalletAccountOption[]>([]);
          const selectedAddress = ref<string>();
          const signer = ref<Signer | null>(null);
        
          const selectExtension = async (name: string) => {
            await web3Enable(DAPP_ORIGIN);
            const filtered = await web3Accounts({ extensions: [name] });
            const nextAccounts = filtered.map(
              (account): WalletAccountOption => ({
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
        
          watch(selectedAddress, (address) => {
            if (!address) return;
            void web3Enable(DAPP_ORIGIN);
          });
        
          watch(
            selectedAddress,
            (address, _, onCleanup) => {
              if (!address) return;
              let cancelled = false;
              onCleanup(() => {
                cancelled = true;
                signer.value = null;
              });
              void web3FromAddress(address)
                .then((injector) => {
                  if (!cancelled) signer.value = injector.signer;
                })
                .catch(() => {
                  if (!cancelled) signer.value = null;
                });
            },
            { immediate: true },
          );
        
          const connection = computed((): SubstrateWalletConnection<Signer> | null => {
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
    "wallet/usePapiWallet.vue":
      () => source`import { computed, ref } from "vue";
        import {
          connectInjectedExtension,
          getInjectedExtensions,
          type InjectedExtension,
          type InjectedPolkadotAccount,
        } from "polkadot-api/pjs-signer";
        import type { PolkadotSigner } from "polkadot-api";
        import type { SubstrateWalletConnection } from "../../types";
        
        export const usePapiWallet = () => {
          const extensionNames = ref<string[]>([]);
          const selectedExtension = ref<InjectedExtension | null>(null);
          const selectedExtensionName = ref<string>();
          const accounts = ref<InjectedPolkadotAccount[]>([]);
          const selectedAccount = ref<InjectedPolkadotAccount>();
          const selectedAddress = ref<string>();
        
          const connection = computed((): SubstrateWalletConnection<PolkadotSigner> | null => {
            if (!selectedAccount.value) return null;
            return {
              address: selectedAccount.value.address,
              signer: selectedAccount.value.polkadotSigner,
            };
          });
        
          const selectExtension = async (name: string) => {
            const injected = await connectInjectedExtension(name);
            selectedExtension.value = injected;
            selectedExtensionName.value = name;
            const nextAccounts = injected.getAccounts();
            accounts.value = nextAccounts;
            selectedAccount.value = nextAccounts[0];
            selectedAddress.value = nextAccounts[0]?.address;
          };
        
          const discoverExtensions = async () => {
            const names = getInjectedExtensions();
            if (names.length === 0) {
              alert("No wallet extension found, install it to connect");
              throw new Error("No Wallet Extension Found!");
            }
            extensionNames.value = names;
            await selectExtension(names[0]);
          };
        
          const selectAccountByAddress = (address: string) => {
            const acc = accounts.value.find((a) => a.address === address);
            if (acc) {
              selectedAccount.value = acc;
              selectedAddress.value = acc.address;
            }
          };
        
          return {
            extensionNames,
            selectedExtensionName,
            selectedExtension,
            accounts,
            selectedAddress,
            selectedAccount,
            connection,
            discoverExtensions,
            selectExtension,
            selectAccountByAddress,
          };
        };
        `,
    "wallet/useWalletWithEvm.api.vue":
      () => source`import type { PolkadotSigner } from "polkadot-api";
        import type { FormValues } from "../../types";
        import { useEvmOriginChains } from "../../evm/useEvmOriginChains";
        import { submitUsingApi } from "../../submit/submitUsingApi";
        import { createWalletControls } from "../shared/createWalletControls";
        import { connectWalletAlert } from "../shared/submitTransfer";
        import { useWalletWithEvmCore } from "../shared/useWalletWithEvmCore";
        import type { UseWalletReturn } from "../../types";
        import SubstrateWalletControls from "../shared/SubstrateWalletControls.vue";
        import { usePapiWallet } from "./usePapiWallet";
        
        export const WalletControls = createWalletControls(SubstrateWalletControls);
        
        export const useWalletWithEvm = (): UseWalletReturn => {
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
        
          const submitTransfer = async (formValues: FormValues) => {
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
    "wallet/useWalletWithEvm.sdk.vue": () => {
      const walletLabel =
        client === "pjs" ? "Pjs" : client === "dedot" ? "Dedot" : "Papi";
      const signerType = client === "papi" ? "PolkadotSigner" : "Signer";

      return source`
        import ${
          client === "papi"
            ? source`type { PolkadotSigner } from "polkadot-api";
        `
            : source`type { Signer } from "@polkadot/api/types";
        `
        }
        import type { FormValues } from "../../types";
        import { submitUsingSdk } from "../../xcm/${client}";
        import { createWalletControls } from "../shared/createWalletControls";
        import {
          connectWalletAlert,
          submitEvmIfNeeded,
        } from "../shared/submitTransfer";
        import { useWalletWithEvmCore } from "../shared/useWalletWithEvmCore";
        import type { UseWalletReturn } from "../../types";
        import SubstrateWalletControls from "../shared/SubstrateWalletControls.vue";
        import { use${walletLabel}Wallet } from "./use${walletLabel}Wallet";
        
        export const WalletControls = createWalletControls(SubstrateWalletControls);
        
        export const useWalletWithEvm = (): UseWalletReturn => {
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
        
          const submitTransfer = async (formValues: FormValues) => {
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
    "wallet/useWalletWithEvmCore.vue":
      () => source`import { computed, ref, unref, watch } from "vue";
        ${
          projectKind === "sdk"
            ? source`import type { TChain } from "${sdkPackage}";
        `
            : ""
        }import { useEvmWallet } from "../evm/useEvmWallet";
        import type {
          SubstrateWalletBase,
          WalletKind,
          WalletSubmitOptions,
        } from "../../types";
        
        export const useWalletWithEvmCore = <TSigner>(
          substrate: SubstrateWalletBase<TSigner>,
        ) => {
          const evm = useEvmWallet();
          const activeWalletKind = ref<WalletKind>("substrate");
        
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
              void substrate.selectExtension(name);
            },
            { immediate: true },
          );
        
          const buildSubmitOptions = (
            from: ${projectKind === "sdk" ? "TChain" : "string"},
          ): WalletSubmitOptions<TSigner> | null => {
            if (activeWalletKind.value === "evm") {
              const walletClient = evm.getWalletClient(from);
              if (!walletClient || !evm.selectedProvider.value) return null;
              return {
                kind: "evm",
                walletClient,
                provider: evm.selectedProvider.value.provider,
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
        
          const setActiveWalletKind = (kind: WalletKind) => {
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
            getEvmWalletClient: evm.getWalletClient,
          };
        };
        `,
  };
};
