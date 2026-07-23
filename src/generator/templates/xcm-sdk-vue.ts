import type { TemplateContext, TemplateFile } from "../types.js";
import type { FragmentRenderer } from "./shared/contracts.js";
import { source } from "./source.js";

export const createXcmSdkVueTemplates = (
  context: TemplateContext,
  renderFragment: FragmentRenderer,
): readonly TemplateFile[] => {
  const {
    projectName,
    packageManager,
    installCmd,
    devCmd,
    client,
    sdkPackage,
    sdkVersion,
    clientLabel,
    evm,
    swap,
    snowbridge,
    evmWallet,
    polkadotApi,
    viem,
    polkadotJsApi,
    polkadotExtensionDapp,
    dedot,
    mipd,
    vue,
    typescript,
    eslintJs,
    eslint,
    globals,
    typescriptEslint,
    vite,
    vitePluginWasm,
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
      render: () => source`# ParaSpell XCM SDK🪄 starter template
        
        Cross-chain transfer demo using the [XCM SDK](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk) with **${clientLabel}**.
        See the [XCM SDK docs](https://paraspell.github.io/docs/xcm-sdk/send-xcm.html) to customize routes and assets.
        
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
        4. Choose the origin and destination chains, currency, amount, and recipient, then **Submit** and approve the transaction in your wallet.
        ${
          evmWallet
            ? source`
        **EVM** is enabled — use the wallet selector to switch between a Substrate wallet and an EVM wallet (e.g. MetaMask) depending on the origin chain.`
            : ""
        }${
          swap
            ? source`
        **Swap** is enabled — toggle *Add Swap* to also convert to a different currency on the destination via an exchange chain.`
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
            "${sdkPackage}": "${sdkVersion}"${
              client === "papi"
                ? source`,
            "@paraspell/descriptors": "${sdkVersion}"`
                : ""
            },
            "vue": "${vue}"${
              swap
                ? source`,
            "@paraspell/swap": "${sdkVersion}"`
                : ""
            }${
              evm
                ? source`,
            "@paraspell/evm": "${sdkVersion}"`
                : ""
            }${
              evmWallet
                ? source`,
            "mipd": "${mipd}",
            "viem": "${viem}"`
                : ""
            }${
              snowbridge
                ? source`,
            "@paraspell/evm-snowbridge": "${sdkVersion}"`
                : ""
            }${
              client === "papi"
                ? source`,
            "polkadot-api": "${polkadotApi}"`
                : ""
            }${
              client === "pjs"
                ? source`,
            "@polkadot/api": "${polkadotJsApi}",
            "@polkadot/extension-dapp": "${polkadotExtensionDapp}"`
                : ""
            }${
              client === "dedot"
                ? source`,
            "dedot": "${dedot}",
            "@polkadot/api": "${polkadotJsApi}",
            "@polkadot/extension-dapp": "${polkadotExtensionDapp}"`
                : ""
            }
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
            "vite-plugin-wasm": "${vitePluginWasm}",
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
        ${
          swap
            ? source`import "@paraspell/swap";
        `
            : ""
        }${renderFragment("paraspell-side-effects")}import XcmTransfer from "./XcmTransfer.vue";
        </script>
        
        <template>
          <div class="header">
            <h1>Vite + Vue + </h1>
            <a
              href="https://paraspell.github.io/docs/xcm-sdk/getting-started.html"
              target="_blank"
              rel="noopener noreferrer"
              class="logo"
            >
              <img src="/paraspell.png" alt="ParaSpell logo" />
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
      path: "src/XcmTransfer.vue",
      skip: false,
      render: () => source`<script setup lang="ts">
        import { ref } from "vue";
        import TransferForm from "./XcmTransferForm.vue";
        import type { FormValues } from "./types";
        import type { TChain } from "${sdkPackage}";
        import {
          ${
            evmWallet
              ? source`useWallet,
          WalletControls,
          WalletKindSelector,`
              : source`use${client === "pjs" ? "Pjs" : client === "papi" ? "Papi" : "Dedot"}Wallet,
          SubstrateWalletControls,`
          }
        } from "./wallet/${client}";${
          !evmWallet
            ? source`
        import { submitUsingSdk } from "./xcm/${client}";`
            : ""
        }
        ${renderFragment("spa/toError")}
        const errorVisible = ref(false);
        const error = ref<Error | null>(null);
        const loading = ref(false);
        const originChain = ref<TChain>("Astar");
        
        ${
          evmWallet
            ? source`const wallet = useWallet();
        
        const handleOriginChange = (origin: TChain) => {
          originChain.value = origin;
        };
        
        const setWalletKind = (kind: typeof wallet.activeWalletKind.value) => {
          wallet.setActiveWalletKind(kind);
        };
        `
            : source`${
                client === "pjs"
                  ? source`const {
          extensionNames,
          selectedExtensionName,
          accounts,
          selectedAddress,
          connection,
          discoverExtensions,
          selectExtension,
          selectAccountByAddress,
        } = usePjsWallet();
        
        const handleOriginChange = (origin: TChain) => {
          originChain.value = origin;
        };
        `
                  : source`${
                      client === "papi"
                        ? source`const {
          extensionNames,
          selectedExtensionName,
          accounts,
          selectedAddress,
          connection,
          discoverExtensions,
          selectExtension,
          selectAccountByAddress,
        } = usePapiWallet();
        
        const handleOriginChange = (origin: TChain) => {
          originChain.value = origin;
        };
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
        } = useDedotWallet();
        
        const handleOriginChange = (origin: TChain) => {
          originChain.value = origin;
        };
        `
                    }`
              }`
        }
        const onSubmit = async (formValues: FormValues) => {
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
              @submit="onSubmit"
              @origin-change="handleOriginChange"
            />
            <p v-if="errorVisible" class="transferError">{{ error?.message }}</p>
          </div>
        </template>
        `,
    },
    {
      path: "src/XcmTransferForm.vue",
      skip: false,
      render: () => source`<script setup lang="ts">
        import { computed, ref, watch } from "vue";
        import useCurrencyOptions from "./useCurrencyOptions";
        import {
          CHAINS,${
            swap
              ? source`
          EXCHANGE_CHAINS,
          isExchange,
          type TExchangeChain,`
              : ""
          }
          isChain,
          type TChain,
        } from "${sdkPackage}";
        import type { FormValues } from "./types";
        
        const props = defineProps<{
          loading: boolean;
          originChain: TChain;
        }>();
        
        const emit = defineEmits<{
          submit: [values: FormValues];
          originChange: [origin: TChain];
        }>();
        
        const destinationChain = ref<TChain>("Hydration");
        const currencyOptionId = ref("");
        ${
          swap
            ? source`const currencyToOptionId = ref("");
        const swapEnabled = ref(false);
        const exchange = ref<TExchangeChain[]>([]);
        const AUTO_EXCHANGE_VALUE = "";
        const exchangeSelectValue = computed(() =>
          exchange.value.length > 0 ? exchange.value : [AUTO_EXCHANGE_VALUE],
        );
        const exchangeSelectSize = EXCHANGE_CHAINS.length + 1;
        `
            : ""
        }const recipient = ref("5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96");
        const amount = ref("5");
        
        const from = computed(() => props.originChain);
        const to = computed(() => destinationChain.value);
        
        const { currencyOptions, currencyMap${swap ? source`, currencyToOptions, currencyToMap` : ""} } =
          useCurrencyOptions(from, to${swap ? source`, swapEnabled, exchange` : ""});
        
        watch(
          currencyOptions,
          (opts) => {
            if (opts.length > 0) {
              currencyOptionId.value = opts[opts.length - 1].value;
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
              currencyToOptionId.value = opts[opts.length - 1].value;
            }
          },
          { immediate: true },
        );`
            : ""
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
            : ""
        }const onOriginChange = (e: Event) => {
          const target = e.target;
          if (!(target instanceof HTMLSelectElement)) return;
        
          const chain = target.value;
          if (isChain(chain)) {
            emit("originChange", chain);
          }
        };
        
        const handleSubmit = (e: Event) => {
          e.preventDefault();
          if (!currencyOptionId.value) return;${
            swap
              ? source`
          if (swapEnabled.value && !currencyToOptionId.value) return;
        `
              : ""
          }
          emit("submit", {
            from: props.originChain,
            to: destinationChain.value,
            currencyOptionId: currencyOptionId.value,
            recipient: recipient.value,
            amount: amount.value,
            currency: currencyMap.value[currencyOptionId.value],${
              swap
                ? source`
            swapEnabled: swapEnabled.value,
            currencyTo: swapEnabled.value
              ? currencyToMap.value[currencyToOptionId.value]
              : undefined,
            exchange: exchange.value,`
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
                @change="onOriginChange"
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
                v-model="currencyOptionId"
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
                  v-model="currencyToOptionId"
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
      path: "src/evm/eip6963.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/eip6963.ts")}
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
      render: () => source`${renderFragment("evm/index.sdk")}
        `,
    },
    {
      path: "src/evm/isEvmOrigin.ts",
      skip: false,
      render: () => source`${renderFragment("evm/isEvmOrigin.sdk")}
        `,
    },
    {
      path: "src/evm/utils.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("evm/utils.ts")}
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
      path: "src/types.ts",
      skip: false,
      render: () => source`${renderFragment("types/sdk.frontend")}
        `,
    },
    {
      path: "src/useCurrencyOptions.ts",
      skip: false,
      render: () => source`${renderFragment("sdk/useCurrencyOptions.vue")}
        `,
    },
    {
      path: "src/vite-env.d.ts",
      skip: false,
      render: () => source`${renderFragment("spa/vite-env.d")}
        `,
    },
    {
      path: "src/wallet/dedot/useDedotWallet.ts",
      skip: Boolean(client !== "dedot"),
      render: () => source`${renderFragment("wallet/useExtensionWallet.vue")}
        `,
    },
    {
      path: "src/wallet/dedot/useWalletWithEvm.ts",
      skip: Boolean(!(evmWallet && client === "dedot")),
      render: () => source`${renderFragment("wallet/useWalletWithEvm.sdk.vue")}
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
      path: ["src/wallet/", client, "/index.ts"].join(""),
      skip: false,
      render: () => source`${
        evmWallet
          ? source`export {
          useWalletWithEvm as useWallet,
          WalletControls,
        } from "./useWalletWithEvm";
        export { WalletKindSelector } from "../evm";
        export type { UseWalletReturn, WalletKind, WalletKindSelectorProps } from "../../types";
        `
          : source`${
              client === "pjs"
                ? source`export { usePjsWallet } from "./usePjsWallet";
        export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
        `
                : source`${
                    client === "papi"
                      ? source`export { usePapiWallet } from "./usePapiWallet";
        export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
        `
                      : source`export { useDedotWallet } from "./useDedotWallet";
        export { default as SubstrateWalletControls } from "../shared/SubstrateWalletControls.vue";
        `
                  }`
            }`
      }
        `,
    },
    {
      path: "src/wallet/papi/usePapiWallet.ts",
      skip: Boolean(client !== "papi"),
      render: () => source`${renderFragment("wallet/usePapiWallet.vue")}
        `,
    },
    {
      path: "src/wallet/papi/useWalletWithEvm.ts",
      skip: Boolean(!(evmWallet && client === "papi")),
      render: () => source`${renderFragment("wallet/useWalletWithEvm.sdk.vue")}
        `,
    },
    {
      path: "src/wallet/pjs/usePjsWallet.ts",
      skip: Boolean(client !== "pjs"),
      render: () => source`${renderFragment("wallet/useExtensionWallet.vue")}
        `,
    },
    {
      path: "src/wallet/pjs/useWalletWithEvm.ts",
      skip: Boolean(!(evmWallet && client === "pjs")),
      render: () => source`${renderFragment("wallet/useWalletWithEvm.sdk.vue")}
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
      render: () => source`${renderFragment("wallet/submitTransfer.sdk")}
        `,
    },
    {
      path: "src/wallet/shared/useWalletWithEvmCore.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("wallet/useWalletWithEvmCore.vue")}
        `,
    },
    {
      path: "src/xcm/dedot.ts",
      skip: Boolean(client !== "dedot"),
      render: () => source`${renderFragment("xcm/dedot")}
        `,
    },
    {
      path: "src/xcm/evmTransfer.ts",
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment("xcm/evmTransfer.sdk")}
        `,
    },
    {
      path: "src/xcm/papi.ts",
      skip: Boolean(client !== "papi"),
      render: () => source`${renderFragment("xcm/papi")}
        `,
    },
    {
      path: "src/xcm/pjs.ts",
      skip: Boolean(client !== "pjs"),
      render: () => source`${renderFragment("xcm/pjs")}
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
        import wasm from "vite-plugin-wasm";
        
        export default defineConfig({
          plugins: [vue(), wasm()],
        });
        `,
    },
  ];
};
