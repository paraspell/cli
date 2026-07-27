import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmApiReactTemplates = (
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
      path: 'src/App.tsx',
      render: () => source`import "./App.css";
        import XcmTransfer from "./XcmTransfer";
        
        const App = () => (
          <>
            <div className="header">
              <h1>XCM API starter</h1>
              <a
                href="https://paraspell.github.io/docs/xcm-api/getting-started.html"
                target="_blank"
                rel="noopener noreferrer"
                className="logo"
              >
                <img src="/paraspell.png" alt="ParaSpell" width={225} height={64} />
              </a>
            </div>
            <XcmTransfer />
            <p className="read-the-docs">
              Click on the ParaSpell logo to read the docs
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
      render: () => source`import { useState, type FC } from "react";
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
          `
              : source`
          const wallet = usePapiWallet();
          const [originChain, setOriginChain] = useState("Astar");
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
                  setActiveWalletKind={wallet.setActiveWalletKind}
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
                onOriginChange={setOriginChain}
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
      render:
        () => source`import { useState, useMemo, FormEvent, FC } from "react";
        import { API_URL } from "./consts";
        import { useApiData } from "./useApiData";
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
        
        const TransferForm: FC<TProps> = ({
          onSubmit,
          loading,
          originChain,
          onOriginChange,
        }) => {
          const [destinationChain, setDestinationChain] = useState("Hydration");
          const [currencyOptionId, setCurrencyOptionId] = useState("");
          ${
            swap
              ? source`const [currencyToOptionId, setCurrencyToOptionId] = useState("");
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
        
          const chainsRequest = useApiData<string>(\`\${API_URL}/chains\`);
          const assetsRequest = useApiData<TAssetInfo>(
            \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(originChain)}&destination=\${encodeURIComponent(destinationChain)}\`,
          );${
            swap
              ? source`
          const swapAssetsRequest = useApiData<TAssetInfo>(
            swapEnabled
              ? \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(destinationChain)}&destination=\${encodeURIComponent(originChain)}\`
              : undefined,
          );`
              : ''
          }
          const { map: currencyMap, options: currencyOptions } = useMemo(
            () => createAssetOptions(assetsRequest.data),
            [assetsRequest.data],
          );
        
          const selectedCurrencyOptionId = currencyOptions.some(
            (option) => option.value === currencyOptionId,
          )
            ? currencyOptionId
            : currencyOptions.at(-1)?.value;
        ${
          swap
            ? source`
        
          const { map: currencyToMap, options: currencyToOptions } = useMemo(
            () => createAssetOptions(swapAssetsRequest.data),
            [swapAssetsRequest.data],
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

          const dataError = chainsRequest.error ?? assetsRequest.error${
            swap ? source` ?? swapAssetsRequest.error` : ''
          };
          const dataLoading = chainsRequest.loading || assetsRequest.loading${
            swap ? source` || swapAssetsRequest.loading` : ''
          };
        
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
              {dataError && (
                <p className="transferError">Could not load options: {dataError.message}</p>
              )}
              <label>
                Origin chain
                <select
                  value={originChain}
                  onChange={(e) => onOriginChange(e.target.value)}
                  disabled={loading || dataLoading}
                  required
                >
                  {chainsRequest.data.map((chain) => (
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
                  disabled={loading || dataLoading}
                  required
                >
                  {chainsRequest.data.map((chain) => (
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
        
              <button type="submit" disabled={loading || dataLoading || !!dataError}>
                {loading ? "Submitting..." : dataLoading ? "Loading options..." : "Submit transaction"}
              </button>
            </form>
          );
        };
        
        export default TransferForm;
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
      render: () => source`${renderFragment('evm/useEvmOriginChains.react')}
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
      path: 'src/main.tsx',
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
      render: () => source`${renderFragment('swap/useExchangeChains.react')}
        `,
    },
    {
      path: 'src/types.ts',
      render: () => source`${renderFragment('types/api.frontend')}
        `,
    },
    {
      path: 'src/useApiData.ts',
      render: () => source`${renderFragment('api/useApiData.react')}
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
      path: 'src/wallet/evm/EvmWalletControls.tsx',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/EvmWalletControls.react')}
        `,
    },
    {
      path: 'src/wallet/evm/WalletKindSelector.tsx',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/WalletKindSelector.react')}
        `,
    },
    {
      path: 'src/wallet/evm/useEvmWallet.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/useEvmWallet.react')}
        `,
    },
    {
      path: 'src/wallet/papi/index.ts',
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
      render: () => source`${renderFragment('wallet/usePapiWallet.react')}
        `,
    },
    {
      path: 'src/wallet/papi/useWalletWithEvm.ts',
      skip: !evmWallet,
      render:
        () => source`${renderFragment('wallet/useWalletWithEvm.api.react')}
        `,
    },
    {
      path: 'src/wallet/shared/SubstrateWalletControls.tsx',
      render:
        () => source`${renderFragment('wallet/SubstrateWalletControls.react')}
        `,
    },
    {
      path: 'src/wallet/shared/createWalletControls.tsx',
      skip: !evmWallet,
      render:
        () => source`${renderFragment('wallet/createWalletControls.react')}
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
      render:
        () => source`${renderFragment('wallet/useWalletWithEvmCore.react')}
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
      render: () => source`import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'
        
        export default defineConfig({
          plugins: [react()],
        })
        `,
    },
  ];
};
