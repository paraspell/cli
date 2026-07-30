import type { TTemplateContext, TTemplateFile } from '../types.js';
import { createFragmentFile } from './fragment-file.js';
import type { TFragmentRenderer } from './shared/fragment-types.js';
import { createSpaBarrelTemplates } from './spa-barrels.js';
import { createSpaToolingTemplates } from './spa-tooling.js';
import { source } from './source.js';

export const createXcmSdkVueTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    client,
    clientName,
    sdkPackage,
    extensions: { swap },
    evmWallet,
  } = context;
  const fragment = createFragmentFile(renderFragment);

  return [
    fragment('src/App.css', 'spa/App.css'),
    {
      path: 'src/App.vue',
      render: () => source`<script setup lang="ts">
        import "./App.css";
        ${
          swap
            ? source`import "@paraspell/swap";
        `
            : ''
        }${renderFragment('paraspell-side-effects')}import { XcmTransfer } from "./components";
        </script>
        
        <template>
          <div class="header">
            <h1>XCM SDK starter</h1>
            <a
              href="https://paraspell.github.io/docs/xcm-sdk/getting-started.html"
              target="_blank"
              rel="noopener noreferrer"
              class="logo"
            >
              <img
                src="/paraspell.png"
                alt="ParaSpell"
                width="225"
                height="64"
              >
            </a>
          </div>
          <XcmTransfer />
          <p class="read-the-docs">
            Click on the ParaSpell logo to read the docs
          </p>
        </template>
        `,
    },
    {
      path: 'src/components/XcmTransfer.vue',
      render: () => source`<script setup lang="ts">
        import { ref } from "vue";
        import TransferForm from "./TransferForm.vue";
        import type { TFormValues } from "../types";
        import type { TChain } from "${sdkPackage}";
        ${
          evmWallet
            ? source`import { WalletControls } from "./WalletControls";
        import WalletKindSelector from "./WalletKindSelector.vue";
        import { useWalletWithEvm } from "../composables";`
            : source`import SubstrateWalletControls from "./SubstrateWalletControls.vue";
        import { use${clientName}Wallet } from "../composables";`
        }${
          !evmWallet
            ? source`
        import { submitUsingSdk } from "../xcm/${client}";`
            : ''
        }
        ${renderFragment('spa/toError')}
        const errorVisible = ref(false);
        const error = ref<Error | null>(null);
        const loading = ref(false);
        const originChain = ref<TChain>("Astar");
        
        ${
          evmWallet
            ? source`const wallet = useWalletWithEvm();
        `
            : source`const {
          extensionNames,
          selectedExtensionName,
          accounts,
          selectedAddress,
          connection,
          discoverExtensions,
          selectExtension,
          selectAccountByAddress,
        } = use${clientName}Wallet();
        `
        }
        const onSubmit = async (formValues: TFormValues) => {
          loading.value = true;
          errorVisible.value = false;
        
          try {
            ${
              evmWallet
                ? source`const submitted = await wallet.submitTransfer(formValues);
            if (!submitted) return;`
                : source`if (!connection.value) {
              alert("No account selected, connect wallet first");
              return;
            }
        
            await submitUsingSdk(
              formValues,
              connection.value.signer,
              connection.value.address,
            );`
            }
            alert("Transaction was successful!");
          } catch (e) {
            error.value = toError(e);
            errorVisible.value = true;
          } finally {
            loading.value = false;
          }
        };
        </script>
        
        <template>
          <div class="transferLayout">
            ${
              evmWallet
                ? source`
            <div class="formHeader">
              <WalletKindSelector
                :active-wallet-kind="wallet.activeWalletKind.value"
                @update:active-wallet-kind="wallet.setActiveWalletKind"
              />
              <WalletControls :wallet="wallet" />
            </div>
            `
                : source`
            <div class="formHeader">
            <SubstrateWalletControls
              :extension-names="extensionNames"
              :selected-extension-name="selectedExtensionName"
              :accounts="accounts"
              :selected-address="selectedAddress"
              @connect-click="discoverExtensions"
              @update:selected-extension-name="selectExtension"
              @update:selected-address="selectAccountByAddress"
            />
            </div>
            `
            }
            <TransferForm
              :loading="loading"
              v-model:origin-chain="originChain"
              @submit="onSubmit"
            />
            <p v-if="errorVisible" class="transferError">{{ error?.message }}</p>
          </div>
        </template>
        `,
    },
    {
      path: 'src/components/TransferForm.vue',
      render: () => source`<script setup lang="ts">
        import { computed, ref, watch } from "vue";
        import { useCurrencyOptions } from "../composables";
        import {
          CHAINS,${
            swap
              ? source`
          EXCHANGE_CHAINS,
          isExchange,
          type TExchangeChain,`
              : ''
          }
          type TChain,
        } from "${sdkPackage}";
        import type { TFormValues } from "../types";
        
        defineProps<{
          loading: boolean;
        }>();
        
        const originChain = defineModel<TChain>("originChain", {
          required: true,
        });

        const emit = defineEmits<{
          submit: [values: TFormValues];
        }>();
        
        const destinationChain = ref<TChain>("Hydration");
        const currencyLocation = ref("");
        ${
          swap
            ? source`const currencyToLocation = ref("");
        const swapEnabled = ref(false);
        const exchange = ref<TExchangeChain[]>([]);
        const AUTO_EXCHANGE_VALUE = "";
        const exchangeSelectValue = computed(() =>
          exchange.value.length > 0 ? exchange.value : [AUTO_EXCHANGE_VALUE],
        );
        const exchangeSelectSize = EXCHANGE_CHAINS.length + 1;
        `
            : ''
        }const recipient = ref("5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96");
        const amount = ref("5");
        
        const from = computed(() => originChain.value);
        const to = computed(() => destinationChain.value);
        
        const { currencyOptions, currencyMap${swap ? source`, currencyToOptions, currencyToMap` : ''} } =
          useCurrencyOptions(from, to${swap ? source`, swapEnabled, exchange` : ''});
        
        watch(
          currencyOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyLocation.value = opts[0].value;
            }
          },
          { immediate: true },
        );${
          swap
            ? source`
        
        watch(
          currencyToOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyToLocation.value = opts[0].value;
            }
          },
          { immediate: true },
        );`
            : ''
        }
        
        ${
          swap
            ? source`const onExchangeChange = (e: Event) => {
          const target = e.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          exchange.value = Array.from(target.selectedOptions, (o) => o.value).filter(
            isExchange,
          );
        };
        
        `
            : ''
        }const handleSubmit = (e: Event) => {
          e.preventDefault();
          const currency = currencyMap.value.get(currencyLocation.value);
          if (!currency) return;${
            swap
              ? source`
          const selectedCurrencyTo = swapEnabled.value
            ? currencyToMap.value.get(currencyToLocation.value)
            : undefined;
          if (swapEnabled.value && !selectedCurrencyTo) return;
        `
              : ''
          }
          emit("submit", {
            from: originChain.value,
            to: destinationChain.value,
            recipient: recipient.value,
            amount: amount.value,
            currency,${
              swap
                ? source`
            swapEnabled: swapEnabled.value,
            currencyTo: selectedCurrencyTo,
            exchange: exchange.value,`
                : ''
            }
          });
        };
        </script>
        
        <template>
          <form @submit="handleSubmit">
            <label>
              Origin chain
              <select
                v-model="originChain"
                required
                :disabled="loading"
              >
                <option
                  v-for="chain in CHAINS"
                  :key="chain"
                  :value="chain"
                >
                  {{ chain }}
                </option>
              </select>
            </label>
        
            <label>
              Destination chain
              <select
                v-model="destinationChain"
                required
                :disabled="loading"
              >
                <option
                  v-for="chain in CHAINS"
                  :key="chain"
                  :value="chain"
                >
                  {{ chain }}
                </option>
              </select>
            </label>
        
            <label>
              Currency
              <select
                v-model="currencyLocation"
                required
              >
                <option
                  v-for="currency in currencyOptions"
                  :key="currency.value"
                  :value="currency.value"
                >
                  {{ currency.label }}
                </option>
              </select>
            </label>
        
            <label>
              Recipient address
              <input
                v-model="recipient"
                type="text"
                required
              >
            </label>
        
            <label>
              Amount
              <input
                v-model="amount"
                type="number"
                required
              >
            </label>${
              swap
                ? source`
        
            <button
              type="button"
              class="secondary"
              @click="swapEnabled = !swapEnabled"
            >
              {{ swapEnabled ? "- Remove Swap" : "+ Add Swap" }}
            </button>
        
            <template v-if="swapEnabled">
              <label>
                Exchange
                <small>
                  Optional. Auto lets the router pick a route. Hold Ctrl/Cmd to select specific exchanges.
                </small>
                <select
                  multiple
                  :size="exchangeSelectSize"
                  :value="exchangeSelectValue"
                  @change="onExchangeChange"
                >
                  <option :value="AUTO_EXCHANGE_VALUE">
                    Auto
                  </option>
                  <option
                    v-for="chain in EXCHANGE_CHAINS"
                    :key="chain"
                    :value="chain"
                  >
                    {{ chain }}
                  </option>
                </select>
              </label>
        
              <label>
                Currency To
                <select
                  v-model="currencyToLocation"
                  required
                >
                  <option
                    v-for="currency in currencyToOptions"
                    :key="currency.value"
                    :value="currency.value"
                  >
                    {{ currency.label }}
                  </option>
                </select>
              </label>
            </template>`
                : ''
            }
        
            <button
              type="submit"
              :disabled="loading"
            >
              {{ loading ? "Submitting..." : "Submit transaction" }}
            </button>
          </form>
        </template>
        `,
    },
    fragment('src/evm/eip6963.ts', 'evm/eip6963.ts', !evmWallet),
    fragment('src/evm/getViemChain.ts', 'evm/getViemChain', !evmWallet),
    fragment('src/evm/utils.ts', 'evm/utils.ts', !evmWallet),
    fragment('src/index.css', 'spa/index.css'),
    fragment('src/requireAsset.ts', 'requireAsset', !swap),
    fragment('src/types.ts', 'types/sdk.frontend'),
    fragment(
      'src/composables/useCurrencyOptions.ts',
      'sdk/useCurrencyOptions.vue',
    ),
    fragment('src/vite-env.d.ts', 'spa/vite-env.d'),
    fragment(
      'src/composables/useDedotWallet.ts',
      'wallet/useExtensionWallet.vue',
      client !== 'dedot',
    ),
    fragment(
      'src/composables/useWalletWithEvm.ts',
      'wallet/useWalletWithEvm.sdk.vue',
      !(evmWallet && client === 'dedot'),
    ),
    fragment(
      'src/components/EvmWalletControls.vue',
      'evm/EvmWalletControls.vue',
      !evmWallet,
    ),
    fragment(
      'src/components/WalletKindSelector.vue',
      'evm/WalletKindSelector.vue',
      !evmWallet,
    ),
    fragment(
      'src/composables/useEvmWallet.ts',
      'evm/useEvmWallet.vue',
      !evmWallet,
    ),
    fragment(
      'src/composables/usePapiWallet.ts',
      'wallet/usePapiWallet.vue',
      client !== 'papi',
    ),
    fragment(
      'src/composables/useWalletWithEvm.ts',
      'wallet/useWalletWithEvm.sdk.vue',
      !(evmWallet && client === 'papi'),
    ),
    fragment(
      'src/composables/usePjsWallet.ts',
      'wallet/useExtensionWallet.vue',
      client !== 'pjs',
    ),
    fragment(
      'src/composables/useWalletWithEvm.ts',
      'wallet/useWalletWithEvm.sdk.vue',
      !(evmWallet && client === 'pjs'),
    ),
    fragment(
      'src/components/SubstrateWalletControls.vue',
      'wallet/SubstrateWalletControls.vue',
    ),
    fragment(
      'src/components/WalletControls.ts',
      'wallet/WalletControls.vue',
      !evmWallet,
    ),
    fragment(
      'src/wallet/shared/submitTransfer.ts',
      'wallet/submitTransfer.sdk',
      !evmWallet,
    ),
    fragment(
      'src/composables/useWalletWithEvmCore.ts',
      'wallet/useWalletWithEvmCore.vue',
      !evmWallet,
    ),
    ...createSpaBarrelTemplates(context),
    fragment('src/xcm/dedot.ts', 'xcm/dedot', client !== 'dedot'),
    fragment('src/xcm/evmTransfer.ts', 'xcm/evmTransfer.sdk', !evmWallet),
    fragment('src/xcm/papi.ts', 'xcm/papi', client !== 'papi'),
    fragment(
      'src/xcm/submitPapiTransaction.ts',
      'papi/submitTransaction',
      client !== 'papi',
    ),
    fragment('src/xcm/pjs.ts', 'xcm/pjs', client !== 'pjs'),
    ...createSpaToolingTemplates(context),
  ];
};
