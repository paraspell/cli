import type { TemplateContext, TemplateFile } from "../types.js";
import type { FragmentRenderer } from "./shared/contracts.js";
import { source } from "./source.js";

export const createXcmApiVueTemplates = (
  context: TemplateContext,
  renderFragment: FragmentRenderer,
): readonly TemplateFile[] => {
  const {
    projectName,
    packageManager,
    installCmd,
    devCmd,
    swap,
    snowbridge,
    evmWallet,
    polkadotApi,
    viem,
    mipd,
    axios,
    vue,
    typescript,
    eslintJs,
    eslint,
    globals,
    typescriptEslint,
    vite,
    vitejsPluginVue,
    eslintPluginVue,
    vueEslintParser,
    vueTsc,
  } = context;

  return [
    {
      path: ".gitignore",
      skip: false,
      render: () => source`# Logs
        *.log
        npm-debug.log*
        yarn-debug.log*
        yarn-error.log*
        pnpm-debug.log*
        
        node_modules
        dist
        dist-ssr
        *.local
        
        # Local secrets — never commit private keys, mnemonics, or RPC keys.
        # Note: Vite exposes any VITE_-prefixed variable to the client bundle.
        .env
        .env.local
        .env.*.local
        
        # Editor / OS
        .vscode/*
        !.vscode/extensions.json
        .idea
        .DS_Store
        `,
    },
    {
      path: "LICENSE",
      skip: false,
      render: () => source`${renderFragment("LICENSE")}
        `,
    },
    {
      path: "README.md",
      skip: false,
      render: () => source`# ParaSpell XCM API⚡️ starter template
        
        Browser demo for the [XCM API](https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api): fetch transfer routes from the API and sign transactions with a connected wallet.
        See the [XCM API docs](https://paraspell.github.io/docs/xcm-api/getting-started.html) for endpoints and configuration.
        
        By default it calls the public ParaSpell API at \`https://api.paraspell.xyz/v1\` (see \`src/consts.ts\`). For production, consider [deploying your own API](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html).
        
        ## Prerequisites
        
        - A browser wallet extension to sign transactions:
          - **Substrate:** [Polkadot.js](https://polkadot.js.org/extension/), [Talisman](https://talisman.xyz/), or [SubWallet](https://www.subwallet.app/).${
            evmWallet
              ? source`
          - **EVM:** an EIP-1193 wallet such as [MetaMask](https://metamask.io/) (for EVM-origin transfers).`
              : ""
          }
        - A funded account on the origin chain. This app submits **live** transfers — use a small amount and a test/throwaway account.
        
        ## Usage
        
        1. Install dependencies: \`${installCmd}\`
        2. Start the dev server: \`${devCmd}\` (Vite prints the local URL, usually \`http://localhost:5173\`)
        3. **Connect a wallet** — click *Connect Wallet*, authorize the dApp in your extension, and pick an account.
        4. Choose the route, currency, amount, and recipient, then **Submit**: the app fetches the transfer from the XCM API and you sign it locally in your wallet.
        ${
          evmWallet
            ? source`
        **EVM** is enabled — use the wallet selector to switch between a Substrate wallet and an EVM wallet (e.g. MetaMask) depending on the origin chain.`
            : ""
        }${
          swap
            ? source`
        **Swap** is enabled — toggle *Add Swap* to also convert to a different currency on the destination.`
            : ""
        }${
          snowbridge
            ? source`
        **Snowbridge** is enabled — \`Ethereum\` origins route across the bridge.`
            : ""
        }
        
        ## Scripts
        
        | Command | Description |
        |---------|-------------|
        | \`${devCmd}\` | Start the Vite dev server |
        | \`${packageManager} run build\` | Production build |
        | \`${packageManager} run preview\` | Preview the production build locally |
        | \`${packageManager} run lint\` | Lint the project |
        
        ## Get Support
        
        - Contact form on our [landing page](https://paraspell.xyz/#contact-us).
        - Message us on [X](https://x.com/paraspell).
        - Support channel on [Telegram](https://t.me/paraspell).
        
        ## License
        
        MIT — see [LICENSE](LICENSE).
        `,
    },
    {
      path: "eslint.config.js",
      skip: false,
      render: () => source`import js from "@eslint/js";
        import globals from "globals";
        import tseslint from "typescript-eslint";
        import pluginVue from "eslint-plugin-vue";
        import vueParser from "vue-eslint-parser";
        
        export default tseslint.config(
          { ignores: ["dist"] },
          js.configs.recommended,
          ...tseslint.configs.recommended,
          ...pluginVue.configs["flat/recommended"],
          {
            files: ["**/*.{ts,vue}"],
            languageOptions: {
              ecmaVersion: 2020,
              globals: globals.browser,
            },
          },
          {
            files: ["**/*.vue"],
            languageOptions: {
              parser: vueParser,
              parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: [".vue"],
              },
            },
          },
          {
            rules: {
              "vue/html-indent": "off",
              "vue/multiline-html-element-content-newline": "off",
              "vue/attributes-order": "off",
            },
          },
        );
        `,
    },
    {
      path: "index.html",
      skip: false,
      render: () => source`${renderFragment("spa/index.html")}
        `,
    },
    {
      path: "package.json",
      skip: false,
      render: () => source`{
          "name": "${projectName}",
          "private": true,
          "version": "1.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "vue-tsc --noEmit && vite build",
            "typecheck": "vue-tsc --noEmit",
            "lint": "eslint .",
            "preview": "vite preview"
          },
          "dependencies": {
            "axios": "${axios}",
            "polkadot-api": "${polkadotApi}"${
              evmWallet
                ? source`,
            "mipd": "${mipd}",
            "viem": "${viem}"`
                : ""
            },
            "vue": "${vue}"
          },
          "devDependencies": {
            "@eslint/js": "${eslintJs}",
            "@vitejs/plugin-vue": "${vitejsPluginVue}",
            "eslint": "${eslint}",
            "eslint-plugin-vue": "${eslintPluginVue}",
            "globals": "${globals}",
            "typescript": "${typescript}",
            "typescript-eslint": "${typescriptEslint}",
            "vite": "${vite}",
            "vue-eslint-parser": "${vueEslintParser}",
            "vue-tsc": "${vueTsc}"
          }
        }
        `,
    },
    {
      path: "src/App.css",
      skip: false,
      render: () => source`${renderFragment("spa/App.css")}
        `,
    },
    {
      path: "src/App.vue",
      skip: false,
      render: () => source`<script setup lang="ts">
        import "./App.css";
        import XcmTransfer from "./XcmTransfer.vue";
        </script>
        
        <template>
          <div class="header">
            <h1>Vite + Vue +</h1>
            <a
              href="https://paraspell.github.io/docs/xcm-api/getting-started.html"
              target="_blank"
              rel="noopener noreferrer"
              class="logo"
            >
              <img
                src="/lightspell.png"
                alt="ParaSpell logo"
              >
            </a>
          </div>
          <XcmTransfer />
          <p class="read-the-docs">
            Click on the LightSpell logo to read the docs
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
      path: "src/XcmTransfer.vue",
      skip: false,
      render: () => source`<script setup lang="ts">
        import { ref } from "vue";
        import TransferForm from "./XcmTransferForm.vue";
        import type { FormValues } from "./types";
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
        ${renderFragment("spa/toError")}
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
        const onSubmit = async (formValues: FormValues) => {
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
      path: "src/XcmTransferForm.vue",
      skip: false,
      render: () => source`<script setup lang="ts">
        import axios from "axios";
        import { ref, computed, watch, onMounted } from "vue";
        import { API_URL } from "./consts";
        import type { AssetInfo, FormValues } from "./types";${
          swap
            ? source`
        import { useExchangeChains } from "./swap";`
            : ""
        }
        
        const props = defineProps<{
          loading: boolean;
          originChain: string;
        }>();
        
        const emit = defineEmits<{
          submit: [values: FormValues];
          originChange: [origin: string];
        }>();
        
        const chains = ref<string[]>([]);
        const destinationChain = ref("Hydration");
        const supportedAssets = ref<AssetInfo[]>([]);
        const currencyOptionId = ref("");
        ${
          swap
            ? source`const supportedSwapAssets = ref<AssetInfo[]>([]);
        const currencyToOptionId = ref("");
        const swapEnabled = ref(false);
        const exchange = ref<string[]>([]);
        const AUTO_EXCHANGE_VALUE = "";
        const exchangeSelectValue = computed(() =>
          exchange.value.length > 0 ? exchange.value : [AUTO_EXCHANGE_VALUE],
        );
        const { chains: exchangeChains } = useExchangeChains();
        const exchangeSelectSize = computed(() => exchangeChains.value.length + 1);
        `
            : ""
        }const recipient = ref(
          "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
        );
        const amount = ref("5");
        
        const fetchChains = async () => {
          const response = await axios.get<string[]>(\`\${API_URL}/chains\`);
          chains.value = response.data;
        };
        
        onMounted(() => {
          void fetchChains();
        });
        
        watch(
          [() => props.originChain, destinationChain],
          async () => {
            const response = await axios.get<AssetInfo[]>(
              \`\${API_URL}/supported-assets?origin=\${props.originChain}&destination=\${destinationChain.value}\`,
            );
            supportedAssets.value = response.data;
          },
          { immediate: true },
        );
        
        ${
          swap
            ? source`watch(
          [() => props.originChain, destinationChain, swapEnabled],
          async () => {
            if (!swapEnabled.value) {
              supportedSwapAssets.value = [];
              return;
            }
        
            const response = await axios.get<AssetInfo[]>(
              \`\${API_URL}/supported-assets?origin=\${destinationChain.value}&destination=\${props.originChain}\`,
            );
            supportedSwapAssets.value = response.data;
          },
          { immediate: true },
        );
        
        `
            : ""
        }
        const currencyMap = computed(() =>
          supportedAssets.value.reduce(
            (map: Record<string, AssetInfo>, asset: AssetInfo) => {
              const key = \`\${asset.symbol ?? "NO_SYMBOL"}-\${JSON.stringify(asset.location)}\`;
              map[key] = asset;
              return map;
            },
            {},
          ),
        );
        
        const currencyOptions = computed(() =>
          Object.keys(currencyMap.value).map((key) => ({
            value: key,
            label: \`\${currencyMap.value[key].symbol ?? "Unknown"} - \${currencyMap.value[key].assetId ?? "Location"}\`,
          })),
        );
        
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
            ? source`const currencyToMap = computed(() =>
          supportedSwapAssets.value.reduce(
            (map: Record<string, AssetInfo>, asset: AssetInfo) => {
              const key = \`\${asset.symbol ?? "NO_SYMBOL"}-\${JSON.stringify(asset.location)}\`;
              map[key] = asset;
              return map;
            },
            {},
          ),
        );
        
        const currencyToOptions = computed(() =>
          Object.keys(currencyToMap.value).map((key) => ({
            value: key,
            label: \`\${currencyToMap.value[key].symbol ?? "Unknown"} - \${currencyToMap.value[key].assetId ?? "Location"}\`,
          })),
        );
        
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
            : ""
        }
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
            : ""
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
                : ""
            }
          });
        };
        </script>
        
        <template>
          <form @submit="handleSubmit">
            <label>
              Origin chain
              <select
                :value="originChain"
                required
                :disabled="loading"
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
                :disabled="loading"
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
                : ""
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
    {
      path: "src/consts.ts",
      skip: false,
      render: () => source`${renderFragment("api/consts")}
        `,
    },
    {
      path: "src/evm/eip6963.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/eip6963.ts")}
        `,
    },
    {
      path: "src/evm/evmOrigins.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/evmOrigins.api.frontend")}
        `,
    },
    {
      path: "src/evm/evmWalletClient.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/evmWalletClient")}
        `,
    },
    {
      path: "src/evm/getViemChain.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/getViemChain")}
        `,
    },
    {
      path: "src/evm/index.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/index.api")}
        `,
    },
    {
      path: "src/evm/useEvmOriginChains.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/useEvmOriginChains.vue")}
        `,
    },
    {
      path: "src/evm/utils.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/utils.ts")}
        `,
    },
    {
      path: "src/fetchFromApi.ts",
      skip: false,
      render: () => source`${renderFragment("api/fetchFromApi")}
        `,
    },
    {
      path: "src/index.css",
      skip: false,
      render: () => source`${renderFragment("spa/index.css")}
        `,
    },
    {
      path: "src/main.ts",
      skip: false,
      render: () => source`import { createApp } from "vue";
        import App from "./App.vue";
        import "./index.css";
        
        createApp(App).mount("#app");
        `,
    },
    {
      path: "src/requireAsset.ts",
      skip: false,
      render: () => source`${renderFragment("requireAsset")}
        `,
    },
    {
      path: "src/submit/submitEvmTx.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("api/submitEvmTx")}
        `,
    },
    {
      path: "src/submit/submitUsingApi.ts",
      skip: false,
      render: () => source`${renderFragment("api/submitUsingApi")}
        `,
    },
    {
      path: "src/swap/exchangeChains.ts",
      skip: Boolean(!swap),
      render: () => source`${renderFragment("swap/exchangeChains.api.frontend")}
        `,
    },
    {
      path: "src/swap/index.ts",
      skip: Boolean(!swap),
      render: () => source`${renderFragment("swap/index.api")}
        `,
    },
    {
      path: "src/swap/useExchangeChains.ts",
      skip: Boolean(!swap),
      render: () => source`${renderFragment("swap/useExchangeChains.vue")}
        `,
    },
    {
      path: "src/types.ts",
      skip: false,
      render: () => source`${renderFragment("types/api.frontend")}
        `,
    },
    {
      path: "src/utils.ts",
      skip: false,
      render: () => source`${renderFragment("api/utils")}
        `,
    },
    {
      path: "src/vite-env.d.ts",
      skip: false,
      render: () => source`${renderFragment("spa/vite-env.d")}
        `,
    },
    {
      path: "src/wallet/evm/EvmWalletControls.vue",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/EvmWalletControls.vue")}
        `,
    },
    {
      path: "src/wallet/evm/WalletKindSelector.vue",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/WalletKindSelector.vue")}
        `,
    },
    {
      path: "src/wallet/evm/index.ts",
      skip: Boolean(!evmWallet),
      render: () => source`export { useEvmWallet } from "./useEvmWallet";
        export { default as EvmWalletControls } from "./EvmWalletControls.vue";
        export type { WalletControlsEvmProps } from "../../types";
        export { default as WalletKindSelector } from "./WalletKindSelector.vue";
        export type {
          EvmAccountOption,
          EvmProviderOption,
          WalletKind,
          WalletKindSelectorProps,
        } from "../../types";
        `,
    },
    {
      path: "src/wallet/evm/useEvmWallet.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/useEvmWallet.vue")}
        `,
    },
    {
      path: "src/wallet/papi/index.ts",
      skip: false,
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
        export type { UseWalletReturn, WalletKind, WalletKindSelectorProps } from "../../types";
        `
            : ""
        }
        `,
    },
    {
      path: "src/wallet/papi/usePapiWallet.ts",
      skip: false,
      render: () => source`${renderFragment("wallet/usePapiWallet.vue")}
        `,
    },
    {
      path: "src/wallet/papi/useWalletWithEvm.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("wallet/useWalletWithEvm.api.vue")}
        `,
    },
    {
      path: "src/wallet/shared/SubstrateWalletControls.vue",
      skip: false,
      render:
        () => source`${renderFragment("wallet/SubstrateWalletControls.vue")}
        `,
    },
    {
      path: "src/wallet/shared/createWalletControls.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("wallet/createWalletControls.vue")}
        `,
    },
    {
      path: "src/wallet/shared/submitTransfer.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("wallet/connectWalletAlert")}
        `,
    },
    {
      path: "src/wallet/shared/useWalletWithEvmCore.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("wallet/useWalletWithEvmCore.vue")}
        `,
    },
    {
      path: "tsconfig.app.json",
      skip: false,
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
      path: "tsconfig.json",
      skip: false,
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
      path: "tsconfig.node.json",
      skip: false,
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
      path: "vite.config.ts",
      skip: false,
      render: () => source`import { defineConfig } from "vite";
        import vue from "@vitejs/plugin-vue";
        
        export default defineConfig({
          plugins: [vue()],
        });
        `,
    },
  ];
};
