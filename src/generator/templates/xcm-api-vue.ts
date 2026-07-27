import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmApiVueTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    extensions: { swap },
    evmWallet,
  } = context;

  return [
    {
      path: 'src/App.css',
      render: () => source`${renderFragment('spa/App.css')}
        `,
    },
    {
      path: 'src/App.vue',
      render: () => source`<script setup lang="ts">
        import "./App.css";
        import XcmTransfer from "./XcmTransfer.vue";
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
      path: 'src/XcmTransfer.vue',
      render: () => source`<script setup lang="ts">
        import { ref } from "vue";
        import TransferForm from "./XcmTransferForm.vue";
        import type { TFormValues } from "./types";
        ${
          evmWallet
            ? source`
        import {
          useWallet,
          WalletControls,
          WalletKindSelector,
        } from "./wallet/papi";
        `
            : source`
        import { usePapiWallet, SubstrateWalletControls } from "./wallet/papi";
        import { submitUsingApi } from "./submit/submitUsingApi";
        `
        }
        ${renderFragment('spa/toError')}
        const errorVisible = ref(false);
        const error = ref<Error | null>(null);
        const loading = ref(false);
        const originChain = ref("Astar");
        
        const handleOriginChange = (origin: string) => {
          originChain.value = origin;
        };
        
        ${
          evmWallet
            ? source`
        const wallet = useWallet();
        
        const setWalletKind = (kind: typeof wallet.activeWalletKind.value) => {
          wallet.setActiveWalletKind(kind);
        };
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
          errorVisible.value = false;
        
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
                @update:active-wallet-kind="setWalletKind"
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
              @connect-click="() => { void discoverExtensions(); }"
              @extension-change="(name: string) => { void selectExtension(name); }"
              @account-change="selectAccountByAddress"
            />
            </div>
            `
            }
            <TransferForm
              :loading="loading"
              :origin-chain="originChain"
              @origin-change="handleOriginChange"
              @submit="onSubmit"
            />
            <p
              v-if="errorVisible"
              class="transferError"
            >
              {{ error?.message }}
            </p>
          </div>
        </template>
        `,
    },
    {
      path: 'src/XcmTransferForm.vue',
      render: () => source`<script setup lang="ts">
        import { ref, computed, watch } from "vue";
        import { API_URL } from "./consts";
        import { useApiData } from "./useApiData";
        import type { TAssetInfo, TFormValues } from "./types";${
          swap
            ? source`
        import { useExchangeChains } from "./swap";`
            : ''
        }
        
        const props = defineProps<{
          loading: boolean;
          originChain: string;
        }>();
        
        const emit = defineEmits<{
          submit: [values: TFormValues];
          originChange: [origin: string];
        }>();

        const createAssetOptions = (assets: TAssetInfo[]) => {
          const map = Object.fromEntries(
            assets.map((asset) => [
              \`\${asset.symbol ?? "NO_SYMBOL"}-\${JSON.stringify(asset.location)}\`,
              asset,
            ]),
          ) as Record<string, TAssetInfo>;

          return {
            map,
            options: Object.entries(map).map(([value, asset]) => ({
              value,
              label: \`\${asset.symbol ?? "Unknown"} - \${asset.assetId ?? "Location"}\`,
            })),
          };
        };
        
        const destinationChain = ref("Hydration");
        const currencyOptionId = ref("");
        ${
          swap
            ? source`const currencyToOptionId = ref("");
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
            \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(props.originChain)}&destination=\${encodeURIComponent(destinationChain.value)}\`,
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
            ? \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(destinationChain.value)}&destination=\${encodeURIComponent(props.originChain)}\`
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
        const currencyMap = computed(() => currencyData.value.map);
        const currencyOptions = computed(() => currencyData.value.options);
        
        watch(
          currencyOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyOptionId.value = opts[opts.length - 1].value;
            }
          },
          { immediate: true },
        );
        
        ${
          swap
            ? source`const currencyToData = computed(() =>
          createAssetOptions(supportedSwapAssets.value),
        );
        const currencyToMap = computed(() => currencyToData.value.map);
        const currencyToOptions = computed(() => currencyToData.value.options);
        
        watch(
          currencyToOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyToOptionId.value = opts[opts.length - 1].value;
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

        const onOriginSelect = (e: Event) => {
          const target = e.target;
          if (!(target instanceof HTMLSelectElement)) return;
          emit("originChange", target.value);
        };
        
        const handleSubmit = (e: Event) => {
          e.preventDefault();
          const currency = currencyMap.value[currencyOptionId.value];
          if (!currency) return;
        ${
          swap
            ? source`
          const selectedCurrencyTo = swapEnabled.value
            ? currencyToMap.value[currencyToOptionId.value]
            : undefined;
          if (swapEnabled.value && !selectedCurrencyTo) return;
        `
            : ''
        }
          emit("submit", {
            from: props.originChain,
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
          <form @submit="handleSubmit">
            <p v-if="dataError" class="transferError">
              Could not load options: {{ dataError.message }}
            </p>
            <label>
              Origin chain
              <select
                :value="originChain"
                required
                :disabled="loading || dataLoading"
                @change="onOriginSelect"
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
                v-model="currencyOptionId"
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
                    v-model="currencyToOptionId"
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
    {
      path: 'src/consts.ts',
      render: () => source`${renderFragment('api/consts')}
        `,
    },
    {
      path: 'src/evm/eip6963.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/eip6963.ts')}
        `,
    },
    {
      path: 'src/evm/evmOrigins.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/evmOrigins.api.frontend')}
        `,
    },
    {
      path: 'src/evm/getViemChain.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/getViemChain')}
        `,
    },
    {
      path: 'src/evm/useEvmOriginChains.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/useEvmOriginChains.vue')}
        `,
    },
    {
      path: 'src/evm/utils.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/utils.ts')}
        `,
    },
    {
      path: 'src/fetchFromApi.ts',
      render: () => source`${renderFragment('api/fetchFromApi')}
        `,
    },
    {
      path: 'src/index.css',
      render: () => source`${renderFragment('spa/index.css')}
        `,
    },
    {
      path: 'src/main.ts',
      render: () => source`import { createApp } from "vue";
        import App from "./App.vue";
        import "./index.css";
        
        createApp(App).mount("#app");
        `,
    },
    {
      path: 'src/requireAsset.ts',
      render: () => source`${renderFragment('requireAsset')}
        `,
    },
    {
      path: 'src/submit/submitEvmTx.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('api/submitEvmTx')}
        `,
    },
    {
      path: 'src/submit/submitUsingApi.ts',
      render: () => source`${renderFragment('api/submitUsingApi')}
        `,
    },
    {
      path: 'src/swap/exchangeChains.ts',
      skip: !swap,
      render: () => source`${renderFragment('swap/exchangeChains.api.frontend')}
        `,
    },
    {
      path: 'src/swap/index.ts',
      skip: !swap,
      render: () => source`${renderFragment('swap/index.api')}
        `,
    },
    {
      path: 'src/swap/useExchangeChains.ts',
      skip: !swap,
      render: () => source`${renderFragment('swap/useExchangeChains.vue')}
        `,
    },
    {
      path: 'src/types.ts',
      render: () => source`${renderFragment('types/api.frontend')}
        `,
    },
    {
      path: 'src/useApiData.ts',
      render: () => source`${renderFragment('api/useApiData.vue')}
        `,
    },
    {
      path: 'src/utils.ts',
      render: () => source`${renderFragment('api/utils')}
        `,
    },
    {
      path: 'src/vite-env.d.ts',
      render: () => source`${renderFragment('spa/vite-env.d')}
        `,
    },
    {
      path: 'src/wallet/evm/EvmWalletControls.vue',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/EvmWalletControls.vue')}
        `,
    },
    {
      path: 'src/wallet/evm/WalletKindSelector.vue',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/WalletKindSelector.vue')}
        `,
    },
    {
      path: 'src/wallet/evm/useEvmWallet.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/useEvmWallet.vue')}
        `,
    },
    {
      path: 'src/wallet/papi/index.ts',
      render: () => source`export { usePapiWallet } from "./usePapiWallet";
        export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
        ${
          evmWallet
            ? source`
        export {
          useWalletWithEvm as useWallet,
          WalletControls,
        } from "./useWalletWithEvm";
        export { default as WalletKindSelector } from "../evm/WalletKindSelector.vue";
        export type { TUseWalletReturn, TWalletKind, TWalletKindSelectorProps } from "../../types";
        `
            : ''
        }
        `,
    },
    {
      path: 'src/wallet/papi/usePapiWallet.ts',
      render: () => source`${renderFragment('wallet/usePapiWallet.vue')}
        `,
    },
    {
      path: 'src/wallet/papi/useWalletWithEvm.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('wallet/useWalletWithEvm.api.vue')}
        `,
    },
    {
      path: 'src/wallet/shared/SubstrateWalletControls.vue',
      render:
        () => source`${renderFragment('wallet/SubstrateWalletControls.vue')}
        `,
    },
    {
      path: 'src/wallet/shared/createWalletControls.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('wallet/createWalletControls.vue')}
        `,
    },
    {
      path: 'src/wallet/shared/submitTransfer.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('wallet/connectWalletAlert')}
        `,
    },
    {
      path: 'src/wallet/shared/useWalletWithEvmCore.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('wallet/useWalletWithEvmCore.vue')}
        `,
    },
    {
      path: 'tsconfig.app.json',
      render: () => source`{
          "compilerOptions": {
            "target": "ES2022",
            "useDefineForClassFields": true,
            "lib": ["ES2022", "DOM", "DOM.Iterable"],
            "module": "ESNext",
            "skipLibCheck": true,
        
            "moduleResolution": "bundler",
            "allowImportingTsExtensions": true,
            "resolveJsonModule": true,
            "isolatedModules": true,
            "moduleDetection": "force",
            "noEmit": true,
            "jsx": "preserve",
        
            "strict": true,
            "noUnusedLocals": true,
            "noUnusedParameters": true,
            "noFallthroughCasesInSwitch": true
          },
          "include": ["src"]
        }
        `,
    },
    {
      path: 'tsconfig.json',
      render: () => source`{
          "files": [],
          "references": [
            { "path": "./tsconfig.app.json" },
            { "path": "./tsconfig.node.json" }
          ]
        }
        `,
    },
    {
      path: 'tsconfig.node.json',
      render: () => source`{
          "compilerOptions": {
            "target": "ES2022",
            "lib": ["ES2023"],
            "module": "ESNext",
            "skipLibCheck": true,
        
            "moduleResolution": "bundler",
            "allowImportingTsExtensions": true,
            "isolatedModules": true,
            "moduleDetection": "force",
            "noEmit": true,
        
            "strict": true,
            "noUnusedLocals": true,
            "noUnusedParameters": true,
            "noFallthroughCasesInSwitch": true
          },
          "include": ["vite.config.ts"]
        }
        `,
    },
    {
      path: 'vite.config.ts',
      render: () => source`import { defineConfig } from "vite";
        import vue from "@vitejs/plugin-vue";
        
        export default defineConfig({
          plugins: [vue()],
        });
        `,
    },
  ];
};
