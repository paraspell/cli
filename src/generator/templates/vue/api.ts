import type { TTemplateContext, TTemplateFile } from '../../types.js';
import { createFragmentFile } from '../fragment-file.js';
import type { TFragmentRenderer } from '../shared/fragment-types.js';
import { createSpaToolingTemplates } from '../spa-tooling.js';
import { source } from '../source.js';

export const createVueApiTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
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
        import XcmTransfer from "./components/XcmTransfer.vue";
        </script>
        
        <template>
          <div class="header">
            <h1>XCM API starter</h1>
            <a
              href="https://paraspell.github.io/docs/xcm-api/getting-started.html"
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
          <p class="read-the-docs">
            <a
              href="https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here
            </a>
            to learn more about how you can deploy the API yourself
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
        import { toError } from "../utils/toError";
        ${
          evmWallet
            ? source`
        import WalletControls from "./WalletControls.vue";
        import WalletKindSelector from "./WalletKindSelector.vue";
        import { useWalletWithEvm } from "../composables/useWalletWithEvm";
        `
            : source`
        import SubstrateWalletControls from "./SubstrateWalletControls.vue";
        import { usePapiWallet } from "../composables/usePapiWallet";
        import { submitUsingApi } from "../utils/submitUsingApi";
        `
        }
        const error = ref<Error | null>(null);
        const loading = ref(false);
        const originChain = ref("Astar");
        
        ${
          evmWallet
            ? source`
        const wallet = useWalletWithEvm();
        `
            : source`
        const {
          extensionNames,
          selectedExtensionName,
          accounts,
          selectedAddress,
          connection,
          discoverExtensions,
          selectExtension,
          selectAccountByAddress,
        } = usePapiWallet();
        `
        }
        const onSubmit = async (formValues: TFormValues) => {
          loading.value = true;
          error.value = null;
        
          try {
            ${
              evmWallet
                ? source`
            const submitted = await wallet.submitTransfer(formValues);
            if (!submitted) return;
            `
                : source`
            if (!connection.value) {
              alert("No account selected, connect wallet first");
              return;
            }
        
            await submitUsingApi(
              formValues,
              connection.value.signer,
              connection.value.address,
            );
            `
            }
            alert("Transaction was successful!");
          } catch (e) {
            error.value = toError(e);
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
              v-model:origin-chain="originChain"
              :loading="loading"
              @submit="onSubmit"
            />
            <p v-if="error" class="transferError" role="alert">
              {{ error.message }}
            </p>
          </div>
        </template>
        `,
    },
    {
      path: 'src/components/TransferForm.vue',
      render: () => source`<script setup lang="ts">
        import { ref, computed, watch } from "vue";
        import { useApiData } from "../composables/useApiData";
        import { API_URL } from "../utils/constants";
        import type { TAssetInfo, TFormValues } from "../types";${
          swap
            ? source`
        import { useExchangeChains } from "../composables/useExchangeChains";`
            : ''
        }
        
        defineProps<{
          loading: boolean;
        }>();
        
        const originChain = defineModel<string>("originChain", {
          required: true,
        });

        const emit = defineEmits<{
          submit: [values: TFormValues];
        }>();

        const createAssetOptions = (assets: TAssetInfo[]) => {
          const assetsByLocation = new Map(
            assets.map((asset) => [JSON.stringify(asset.location), asset]),
          );

          return {
            assetsByLocation,
            options: Array.from(assetsByLocation, ([value, asset]) => ({
              value,
              label: \`\${asset.symbol} - \${asset.assetId ?? "Location"}\`,
            })),
          };
        };
        
        const destinationChain = ref("Hydration");
        const currencyLocation = ref("");
        ${
          swap
            ? source`const currencyToLocation = ref("");
        const swapEnabled = ref(false);
        const exchange = ref<string[]>([]);
        const AUTO_EXCHANGE_VALUE = "";
        const exchangeSelectValue = computed(() =>
          exchange.value.length > 0 ? exchange.value : [AUTO_EXCHANGE_VALUE],
        );
        const { chains: exchangeChains } = useExchangeChains();
        const exchangeSelectSize = computed(() => exchangeChains.value.length + 1);
        `
            : ''
        }const recipient = ref(
          "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
        );
        const amount = ref("5");
        
        const chainsUrl = computed(() => \`\${API_URL}/chains\`);
        const assetsUrl = computed(
          () =>
            \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(originChain.value)}&destination=\${encodeURIComponent(destinationChain.value)}\`,
        );
        const {
          data: chains,
          loading: chainsLoading,
          error: chainsError,
        } = useApiData<string>(chainsUrl);
        const {
          data: supportedAssets,
          loading: assetsLoading,
          error: assetsError,
        } = useApiData<TAssetInfo>(assetsUrl);${
          swap
            ? source`
        const swapAssetsUrl = computed(() =>
          swapEnabled.value
            ? \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(destinationChain.value)}&destination=\${encodeURIComponent(originChain.value)}\`
            : undefined,
        );
        const {
          data: supportedSwapAssets,
          loading: swapAssetsLoading,
          error: swapAssetsError,
        } = useApiData<TAssetInfo>(swapAssetsUrl);`
            : ''
        }

        const currencyData = computed(() =>
          createAssetOptions(supportedAssets.value),
        );
        const currencies = computed(() => currencyData.value.assetsByLocation);
        const currencyOptions = computed(() => currencyData.value.options);
        
        watch(
          currencyOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyLocation.value = opts[0].value;
            }
          },
          { immediate: true },
        );
        
        ${
          swap
            ? source`const currencyToData = computed(() =>
          createAssetOptions(supportedSwapAssets.value),
        );
        const currenciesTo = computed(() => currencyToData.value.assetsByLocation);
        const currencyToOptions = computed(() => currencyToData.value.options);
        
        watch(
          currencyToOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyToLocation.value = opts[0].value;
            }
          },
          { immediate: true },
        );
        
        const onExchangeChange = (e: Event) => {
          const target = e.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          const selected = Array.from(target.selectedOptions, (o) => o.value);
          const exchanges = selected.filter((value) => value !== AUTO_EXCHANGE_VALUE);
          exchange.value = exchanges.length > 0 ? exchanges : [];
        };
        
        `
            : ''
        }
        const dataError = computed(
          () => chainsError.value ?? assetsError.value${
            swap ? source` ?? swapAssetsError.value` : ''
          },
        );
        const dataLoading = computed(
          () => chainsLoading.value || assetsLoading.value${
            swap ? source` || swapAssetsLoading.value` : ''
          },
        );

        const handleSubmit = () => {
          const currency = currencies.value.get(currencyLocation.value);
          if (!currency) return;
        ${
          swap
            ? source`
          const selectedCurrencyTo = swapEnabled.value
            ? currenciesTo.value.get(currencyToLocation.value)
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
            exchange: swapEnabled.value ? exchange.value : undefined,`
                : ''
            }
          });
        };
        </script>
        
        <template>
          <form @submit.prevent="handleSubmit">
            <p v-if="dataError" class="transferError" role="alert">
              Could not load options: {{ dataError.message }}
            </p>
            <label>
              Origin chain
              <select
                v-model="originChain"
                required
                :disabled="loading || dataLoading"
              >
                <option
                  v-for="chain in chains"
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
                :disabled="loading || dataLoading"
              >
                <option
                  v-for="chain in chains"
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
                  v-for="option in currencyOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
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
                min="0"
                step="any"
                required
              >
            </label>
        
            ${
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
                    Optional. Auto lets the router pick a route. Hold Ctrl/Cmd to select
                    specific exchanges.
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
                      v-for="chain in exchangeChains"
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
                      v-for="option in currencyToOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
              </template>
            `
                : ''
            }
        
            <button
              type="submit"
              :disabled="loading || dataLoading || !!dataError"
            >
              {{ loading ? "Submitting..." : dataLoading ? "Loading options..." : "Submit transaction" }}
            </button>
          </form>
        </template>
        `,
    },
    fragment('src/utils/constants.ts', 'api/consts'),
    fragment('src/utils/eip6963.ts', 'evm/eip6963.ts', !evmWallet),
    fragment(
      'src/utils/evmOrigins.ts',
      'evm/evmOrigins.api.frontend',
      !evmWallet,
    ),
    fragment('src/utils/getViemChain.ts', 'evm/getViemChain', !evmWallet),
    fragment(
      'src/composables/useEvmOriginChains.ts',
      'evm/useEvmOriginChains.vue',
      !evmWallet,
    ),
    fragment('src/utils/evmWallet.ts', 'evm/utils.ts', !evmWallet),
    fragment('src/utils/fetchFromApi.ts', 'api/fetchFromApi'),
    fragment('src/index.css', 'spa/index.css'),
    fragment('src/utils/toError.ts', 'spa/toError'),
    fragment('src/utils/requireSwapCurrency.ts', 'requireAsset', !swap),
    fragment('src/utils/submitEvmTx.ts', 'api/submitEvmTx', !evmWallet),
    fragment('src/utils/submitPapiTransaction.ts', 'papi/submitTransaction'),
    fragment('src/utils/submitUsingApi.ts', 'api/submitUsingApi'),
    fragment(
      'src/utils/exchangeChains.ts',
      'swap/exchangeChains.api.frontend',
      !swap,
    ),
    fragment(
      'src/composables/useExchangeChains.ts',
      'swap/useExchangeChains.vue',
      !swap,
    ),
    fragment('src/types.ts', 'types/api.frontend'),
    fragment('src/composables/useApiData.ts', 'api/useApiData.vue'),
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
    fragment('src/composables/usePapiWallet.ts', 'wallet/usePapiWallet.vue'),
    fragment(
      'src/composables/useWalletWithEvm.ts',
      'wallet/useWalletWithEvm.api',
      !evmWallet,
    ),
    fragment(
      'src/components/SubstrateWalletControls.vue',
      'wallet/SubstrateWalletControls.vue',
    ),
    fragment(
      'src/components/WalletControls.vue',
      'wallet/WalletControls.vue',
      !evmWallet,
    ),
    fragment(
      'src/utils/connectWalletAlert.ts',
      'wallet/connectWalletAlert',
      !evmWallet,
    ),
    fragment(
      'src/composables/useWalletWithEvmCore.ts',
      'wallet/useWalletWithEvmCore.vue',
      !evmWallet,
    ),
    ...createSpaToolingTemplates(context),
  ];
};
