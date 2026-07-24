import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmApiReactTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    projectName,
    packageManager,
    installCmd,
    devCmd,
    extensions: { swap, snowbridge },
    evmWallet,
    polkadotApi,
    viem,
    mipd,
    axios,
    typescript,
    eslintJs,
    eslint,
    eslintConfigPrettier,
    globals,
    prettier,
    typescriptEslint,
    vite,
    typesReact,
    typesReactDom,
    vitejsPluginReact,
    eslintPluginReactHooks,
    eslintPluginReactRefresh,
    react,
    reactDom,
  } = context;

  return [
    {
      path: '.gitignore',
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
      path: 'LICENSE',
      skip: false,
      render: () => source`${renderFragment('LICENSE')}
        `,
    },
    {
      path: 'README.md',
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
              : ''
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
            : ''
        }${
          swap
            ? source`
        **Swap** is enabled — toggle *Add Swap* to also convert to a different currency on the destination.`
            : ''
        }${
          snowbridge
            ? source`
        **Snowbridge** is enabled — \`Ethereum\` origins route across the bridge.`
            : ''
        }
        
        ## Scripts
        
        | Command | Description |
        |---------|-------------|
        | \`${devCmd}\` | Start the Vite dev server |
        | \`${packageManager} run build\` | Production build |
        | \`${packageManager} run preview\` | Preview the production build locally |
        | \`${packageManager} run lint\` | Lint the project |
        | \`${packageManager} run lint:fix\` | Fix auto-fixable lint issues |
        | \`${packageManager} run format\` | Format the project with Prettier |
        | \`${packageManager} run format:check\` | Check Prettier formatting |
        
        ## Get Support
        
        - Contact form on our [landing page](https://paraspell.xyz/#contact-us).
        - Message us on [X](https://x.com/paraspell).
        - Support channel on [Telegram](https://t.me/paraspell).
        
        ## License
        
        MIT — see [LICENSE](LICENSE).
        `,
    },
    {
      path: 'index.html',
      skip: false,
      render: () => source`${renderFragment('spa/index.html')}
        `,
    },
    {
      path: 'package.json',
      skip: false,
      render: () => source`{
          "name": "${projectName}",
          "private": true,
          "version": "1.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "tsc -b && vite build",
            "typecheck": "tsc -b --noEmit",
            "lint": "eslint . --max-warnings 0",
            "lint:fix": "eslint . --fix",
            "format": "prettier . --write",
            "format:check": "prettier . --check",
            "preview": "vite preview"
          },
          "dependencies": {
            "axios": "${axios}",
            "polkadot-api": "${polkadotApi}"${
              evmWallet
                ? source`,
            "mipd": "${mipd}",
            "viem": "${viem}"`
                : ''
            }
          },
          "devDependencies": {
            "@eslint/js": "${eslintJs}",
            "@types/react": "${typesReact}",
            "@types/react-dom": "${typesReactDom}",
            "@vitejs/plugin-react": "${vitejsPluginReact}",
            "eslint": "${eslint}",
            "eslint-config-prettier": "${eslintConfigPrettier}",
            "eslint-plugin-react-hooks": "${eslintPluginReactHooks}",
            "eslint-plugin-react-refresh": "${eslintPluginReactRefresh}",
            "globals": "${globals}",
            "prettier": "${prettier}",
            "react": "${react}",
            "react-dom": "${reactDom}",
            "typescript": "${typescript}",
            "typescript-eslint": "${typescriptEslint}",
            "vite": "${vite}"
          }
        }
        `,
    },
    {
      path: 'src/App.css',
      skip: false,
      render: () => source`${renderFragment('spa/App.css')}
        `,
    },
    {
      path: 'src/App.tsx',
      skip: false,
      render: () => source`import "./App.css";
        import XcmTransfer from "./XcmTransfer";
        
        const App = () => (
          <>
            <div className="header">
              <h1>Vite + React + </h1>
              <a
                href="https://paraspell.github.io/docs/xcm-api/getting-started.html"
                target="_blank"
                rel="noopener noreferrer"
                className="logo"
              >
                <img src="/lightspell.png" alt="ParaSpell logo" />
              </a>
            </div>
            <XcmTransfer />
            <p className="read-the-docs">
              Click on the LightSpell logo to read the docs
            </p>
            <p className="read-the-docs">
              <a
                href="https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here
              </a>{" "}
              to learn more about how you can deploy the API yourself
            </p>
          </>
        );
        
        export default App;
        `,
    },
    {
      path: 'src/XcmTransfer.tsx',
      skip: false,
      render:
        () => source`import { useCallback, useState, type FC } from "react";
        import TransferForm from "./XcmTransferForm";
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
        import { SubstrateWalletControls, usePapiWallet } from "./wallet/papi";
        import { submitUsingApi } from "./submit/submitUsingApi";
        `
        }
        ${renderFragment('spa/toError')}
        const XcmTransfer: FC = () => {
          const [errorVisible, setErrorVisible] = useState(false);
          const [error, setError] = useState<Error | null>(null);
          const [loading, setLoading] = useState(false);
        
          ${
            evmWallet
              ? source`
          const wallet = useWallet();
          const [originChain, setOriginChain] = useState("Astar");
        
          const handleOriginChange = useCallback(
            (origin: string) => {
              setOriginChain(origin);
            },
            [],
          );
        
          const setWalletKind = useCallback(
            (kind: typeof wallet.activeWalletKind) => {
              wallet.setActiveWalletKind(kind);
            },
            [wallet],
          );
          `
              : source`
          const wallet = usePapiWallet();
          const [originChain, setOriginChain] = useState("Astar");
        
          const handleOriginChange = useCallback((origin: string) => {
            setOriginChain(origin);
          }, []);
          `
          }
        
          const onSubmit = async (formValues: TFormValues) => {
            setLoading(true);
            setErrorVisible(false);
        
            try {
              ${
                evmWallet
                  ? source`
              const submitted = await wallet.submitTransfer(formValues);
              if (!submitted) return;
              `
                  : source`
              if (!wallet.connection) {
                alert("No account selected, connect wallet first");
                return;
              }
        
              await submitUsingApi(
                formValues,
                wallet.connection.signer,
                wallet.connection.address,
              );
              `
              }
              alert("Transaction was successful!");
            } catch (error) {
              setError(toError(error));
              setErrorVisible(true);
            } finally {
              setLoading(false);
            }
          };
        
          return (
            <div className="transferLayout">
              ${
                evmWallet
                  ? source`
              <div className="formHeader">
                <WalletKindSelector
                  activeWalletKind={wallet.activeWalletKind}
                  setActiveWalletKind={setWalletKind}
                />
                <WalletControls wallet={wallet} />
              </div>
              `
                  : source`
              <div className="formHeader">
              <SubstrateWalletControls
                extensionNames={wallet.extensionNames}
                selectedExtensionName={wallet.selectedExtensionName}
                accounts={wallet.accounts}
                selectedAddress={wallet.selectedAddress}
                onConnectClick={() => {
                  void wallet.discoverExtensions();
                }}
                onExtensionChange={(name) => {
                  void wallet.selectExtension(name);
                }}
                onAccountChange={wallet.selectAccountByAddress}
              />
              </div>
              `
              }
              <TransferForm
                onSubmit={onSubmit}
                loading={loading}
                originChain={originChain}
                onOriginChange={handleOriginChange}
              />
              {errorVisible && <p className="transferError">{error?.message}</p>}
            </div>
          );
        };
        
        export default XcmTransfer;
        `,
    },
    {
      path: 'src/XcmTransferForm.tsx',
      skip: false,
      render: () => source`import axios from "axios";
        import { useState, useMemo, FormEvent, FC, useEffect } from "react";
        import { API_URL } from "./consts";
        import type { TAssetInfo, TFormValues } from "./types";${
          swap
            ? source`
        import { useExchangeChains } from "./swap";`
            : ''
        }
        
        type TProps = {
          onSubmit: (values: TFormValues) => void;
          loading: boolean;
          originChain: string;
          onOriginChange: (origin: string) => void;
        };
        
        const TransferForm: FC<TProps> = ({
          onSubmit,
          loading,
          originChain,
          onOriginChange,
        }) => {
          const [chains, setChains] = useState<string[]>([]);
          const [destinationChain, setDestinationChain] = useState("Hydration");
          const [supportedAssets, setSupportedAssets] = useState<TAssetInfo[]>([]);
          const [currencyOptionId, setCurrencyOptionId] = useState("");
          ${
            swap
              ? source`const [supportedSwapAssets, setSupportedSwapAssets] = useState<TAssetInfo[]>([]);
          const [currencyToOptionId, setCurrencyToOptionId] = useState("");
          const [swapEnabled, setSwapEnabled] = useState(false);
          const [exchange, setExchange] = useState<string[]>([]);
          const AUTO_EXCHANGE_VALUE = "";
          const exchangeSelectValue =
            exchange.length > 0 ? exchange : [AUTO_EXCHANGE_VALUE];
          const { chains: exchangeChains } = useExchangeChains();
          `
              : ''
          }const [recipient, setRecipient] = useState(
            "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
          );
          const [amount, setAmount] = useState("5");
        
          useEffect(() => {
            const fetchChains = async () => {
              const response = await axios.get(\`\${API_URL}/chains\`);
              setChains(response.data);
            };
            void fetchChains();
          }, []);
        
          useEffect(() => {
            const fetchAssets = async () => {
              const response = await axios.get<TAssetInfo[]>(
                \`\${API_URL}/supported-assets?origin=\${originChain}&destination=\${destinationChain}\`,
              );
              setSupportedAssets(response.data);
            };
            void fetchAssets();
          }, [originChain, destinationChain]);
        
          ${
            swap
              ? source`useEffect(() => {
            if (!swapEnabled) {
              return;
            }
        
            const abortController = new AbortController();
        
            const fetchSwapAssets = async () => {
              const response = await axios.get<TAssetInfo[]>(
                \`\${API_URL}/supported-assets?origin=\${destinationChain}&destination=\${originChain}\`,
              );
              if (!abortController.signal.aborted) {
                setSupportedSwapAssets(response.data);
              }
            };
            void fetchSwapAssets();
        
            return () => {
              abortController.abort();
            };
          }, [originChain, destinationChain, swapEnabled]);
        
          `
              : ''
          }
          const currencyMap = useMemo(
            () =>
              supportedAssets.reduce(
                (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
                  const key = \`\${asset.symbol ?? "NO_SYMBOL"}-\${JSON.stringify(asset.location)}\`;
                  map[key] = asset;
                  return map;
                },
                {},
              ),
            [supportedAssets],
          );
        
          const currencyOptions = useMemo(
            () =>
              Object.keys(currencyMap).map((key) => ({
                value: key,
                label: \`\${currencyMap[key].symbol ?? "Unknown"} - \${currencyMap[key].assetId ?? "Location"}\`,
              })),
            [currencyMap],
          );
        
          const selectedCurrencyOptionId = currencyOptions.some(
            (option) => option.value === currencyOptionId,
          )
            ? currencyOptionId
            : currencyOptions.at(-1)?.value;
        ${
          swap
            ? source`
        
          const currencyToMap = useMemo(
            () =>
              supportedSwapAssets.reduce(
                (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
                  const key = \`\${asset.symbol ?? "NO_SYMBOL"}-\${JSON.stringify(asset.location)}\`;
                  map[key] = asset;
                  return map;
                },
                {},
              ),
            [supportedSwapAssets],
          );
        
          const currencyToOptions = useMemo(
            () =>
              Object.keys(currencyToMap).map((key) => ({
                value: key,
                label: \`\${currencyToMap[key].symbol ?? "Unknown"} - \${currencyToMap[key].assetId ?? "Location"}\`,
              })),
            [currencyToMap],
          );
        
          const selectedCurrencyToOptionId = currencyToOptions.some(
            (option) => option.value === currencyToOptionId,
          )
            ? currencyToOptionId
            : currencyToOptions.at(-1)?.value;
        
          const handleExchangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            const exchanges = selected.filter((value) => value !== AUTO_EXCHANGE_VALUE);
            setExchange(exchanges.length > 0 ? exchanges : []);
          };
        `
            : ''
        }
        
          const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!selectedCurrencyOptionId) return;
        ${
          swap
            ? source`
            if (swapEnabled && !selectedCurrencyToOptionId) return;
            const selectedCurrencyTo =
              swapEnabled && selectedCurrencyToOptionId
                ? currencyToMap[selectedCurrencyToOptionId]
                : undefined;
            if (swapEnabled && !selectedCurrencyTo) return;
        `
            : ''
        }
        
            onSubmit({
              from: originChain,
              to: destinationChain,
              recipient,
              amount,
              currency: currencyMap[selectedCurrencyOptionId],${
                swap
                  ? source`
              swapEnabled,
              currencyTo: selectedCurrencyTo,
              exchange: swapEnabled ? exchange : undefined,`
                  : ''
              }
            });
          };
        
          return (
            <form onSubmit={handleSubmit}>
              <label>
                Origin chain
                <select
                  value={originChain}
                  onChange={(e) => onOriginChange(e.target.value)}
                  disabled={loading}
                  required
                >
                  {chains.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </label>
        
              <label>
                Destination chain
                <select
                  value={destinationChain}
                  onChange={(e) => setDestinationChain(e.target.value)}
                  disabled={loading}
                  required
                >
                  {chains.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </label>
        
              <label>
                Currency
                <select
                  value={selectedCurrencyOptionId}
                  onChange={(e) => setCurrencyOptionId(e.target.value)}
                  required
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
        
              <label>
                Recipient address
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </label>
        
              <label>
                Amount
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
        
              ${
                swap
                  ? source`
              <>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setSwapEnabled((prev) => !prev)}
                  >
                    {swapEnabled ? "- Remove Swap" : "+ Add Swap"}
                  </button>
        
                  {swapEnabled && (
                    <>
                      <label>
                        Exchange
                        <small>
                          Optional. Auto lets the router pick a route. Hold Ctrl/Cmd to
                          select specific exchanges.
                        </small>
                        <select
                          multiple
                          size={exchangeChains.length + 1}
                          value={exchangeSelectValue}
                          onChange={handleExchangeChange}
                        >
                          <option value={AUTO_EXCHANGE_VALUE}>Auto</option>
                          {exchangeChains.map((chain) => (
                            <option key={chain} value={chain}>
                              {chain}
                            </option>
                          ))}
                        </select>
                      </label>
        
                      <label>
                        Currency To
                        <select
                          value={selectedCurrencyToOptionId}
                          onChange={(e) => setCurrencyToOptionId(e.target.value)}
                          required
                        >
                          {currencyToOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                </>
              `
                  : ''
              }
        
              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit transaction"}
              </button>
            </form>
          );
        };
        
        export default TransferForm;
        `,
    },
    {
      path: 'src/consts.ts',
      skip: false,
      render: () => source`${renderFragment('api/consts')}
        `,
    },
    {
      path: 'src/evm/eip6963.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/eip6963.ts')}
        `,
    },
    {
      path: 'src/evm/evmOrigins.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/evmOrigins.api.frontend')}
        `,
    },
    {
      path: 'src/evm/evmWalletClient.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/evmWalletClient')}
        `,
    },
    {
      path: 'src/evm/getViemChain.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/getViemChain')}
        `,
    },
    {
      path: 'src/evm/index.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/index.api')}
        `,
    },
    {
      path: 'src/evm/useEvmOriginChains.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/useEvmOriginChains.react')}
        `,
    },
    {
      path: 'src/evm/utils.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/utils.ts')}
        `,
    },
    {
      path: 'src/fetchFromApi.ts',
      skip: false,
      render: () => source`${renderFragment('api/fetchFromApi')}
        `,
    },
    {
      path: 'src/index.css',
      skip: false,
      render: () => source`${renderFragment('spa/index.css')}
        `,
    },
    {
      path: 'src/main.tsx',
      skip: false,
      render: () => source`import { StrictMode } from 'react'
        import { createRoot } from 'react-dom/client'
        import App from './App.tsx'
        import './index.css'
        
        const rootElement = document.getElementById("root");
        if (!rootElement) {
          throw new Error("Root element #root not found.");
        }
        
        createRoot(rootElement).render(
          <StrictMode>
            <App />
          </StrictMode>,
        )
        `,
    },
    {
      path: 'src/requireAsset.ts',
      skip: false,
      render: () => source`${renderFragment('requireAsset')}
        `,
    },
    {
      path: 'src/submit/submitEvmTx.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('api/submitEvmTx')}
        `,
    },
    {
      path: 'src/submit/submitUsingApi.ts',
      skip: false,
      render: () => source`${renderFragment('api/submitUsingApi')}
        `,
    },
    {
      path: 'src/swap/exchangeChains.ts',
      skip: Boolean(!swap),
      render: () => source`${renderFragment('swap/exchangeChains.api.frontend')}
        `,
    },
    {
      path: 'src/swap/index.ts',
      skip: Boolean(!swap),
      render: () => source`${renderFragment('swap/index.api')}
        `,
    },
    {
      path: 'src/swap/useExchangeChains.ts',
      skip: Boolean(!swap),
      render: () => source`${renderFragment('swap/useExchangeChains.react')}
        `,
    },
    {
      path: 'src/types.ts',
      skip: false,
      render: () => source`${renderFragment('types/api.frontend')}
        `,
    },
    {
      path: 'src/utils.ts',
      skip: false,
      render: () => source`${renderFragment('api/utils')}
        `,
    },
    {
      path: 'src/vite-env.d.ts',
      skip: false,
      render: () => source`${renderFragment('spa/vite-env.d')}
        `,
    },
    {
      path: 'src/wallet/evm/EvmWalletControls.tsx',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/EvmWalletControls.react')}
        `,
    },
    {
      path: 'src/wallet/evm/WalletKindSelector.tsx',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/WalletKindSelector.react')}
        `,
    },
    {
      path: 'src/wallet/evm/index.ts',
      skip: Boolean(!evmWallet),
      render:
        () => source`export { EvmWalletControls } from "./EvmWalletControls";
        export type { TWalletControlsEvmProps } from "../../types";
        export { useEvmWallet } from "./useEvmWallet";
        export type { TEvmAccountOption, TEvmProviderOption } from "../../types";
        export { WalletKindSelector } from "./WalletKindSelector";
        export type { TWalletKind, TWalletKindSelectorProps } from "../../types";
        `,
    },
    {
      path: 'src/wallet/evm/useEvmWallet.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/useEvmWallet.react')}
        `,
    },
    {
      path: 'src/wallet/papi/index.ts',
      skip: false,
      render: () => source`export { usePapiWallet } from "./usePapiWallet";
        export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
        ${
          evmWallet
            ? source`
        export {
          useWalletWithEvm as useWallet,
          WalletControls,
        } from "./useWalletWithEvm";
        export { WalletKindSelector } from "../evm/WalletKindSelector";
        export type { TUseWalletReturn, TWalletKind, TWalletKindSelectorProps } from "../../types";
        `
            : ''
        }
        `,
    },
    {
      path: 'src/wallet/papi/usePapiWallet.ts',
      skip: false,
      render: () => source`${renderFragment('wallet/usePapiWallet.react')}
        `,
    },
    {
      path: 'src/wallet/papi/useWalletWithEvm.ts',
      skip: Boolean(!evmWallet),
      render:
        () => source`${renderFragment('wallet/useWalletWithEvm.api.react')}
        `,
    },
    {
      path: 'src/wallet/shared/SubstrateWalletControls.tsx',
      skip: false,
      render:
        () => source`${renderFragment('wallet/SubstrateWalletControls.react')}
        `,
    },
    {
      path: 'src/wallet/shared/createWalletControls.tsx',
      skip: Boolean(!evmWallet),
      render:
        () => source`${renderFragment('wallet/createWalletControls.react')}
        `,
    },
    {
      path: 'src/wallet/shared/submitTransfer.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('wallet/connectWalletAlert')}
        `,
    },
    {
      path: 'src/wallet/shared/useWalletWithEvmCore.ts',
      skip: Boolean(!evmWallet),
      render:
        () => source`${renderFragment('wallet/useWalletWithEvmCore.react')}
        `,
    },
    {
      path: 'tsconfig.app.json',
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
            "isolatedModules": true,
            "moduleDetection": "force",
            "noEmit": true,
            "jsx": "react-jsx",
        
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
      path: 'tsconfig.node.json',
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
      path: 'vite.config.ts',
      skip: false,
      render: () => source`import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'
        
        export default defineConfig({
          plugins: [react()],
        })
        `,
    },
  ];
};
