import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmSdkReactTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    client,
    sdkPackage,
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
        ${
          swap
            ? source`import "@paraspell/swap";
        `
            : ''
        }${renderFragment('paraspell-side-effects')}import XcmTransfer from "./XcmTransfer";
        
        const App = () => (
          <>
            <div className="header">
              <h1>XCM SDK starter</h1>
              <a
                href="https://paraspell.github.io/docs/xcm-sdk/getting-started.html"
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
        import type { TChain } from "${sdkPackage}";
        import {
          ${
            evmWallet
              ? source`useWallet,
          WalletControls,
          WalletKindSelector,`
              : source`
          use${client === 'pjs' ? 'Pjs' : client === 'papi' ? 'Papi' : 'Dedot'}Wallet,
          SubstrateWalletControls,`
          }
        } from "./wallet/${client}";${
          !evmWallet
            ? source`
        import { submitUsingSdk } from "./xcm/${client}";`
            : ''
        }
        ${renderFragment('spa/toError')}
        const XcmTransfer: FC = () => {
          const [errorVisible, setErrorVisible] = useState(false);
          const [error, setError] = useState<Error | null>(null);
          const [loading, setLoading] = useState(false);
        
          ${evmWallet ? source`const wallet = useWallet();` : source`${client === 'pjs' ? source`const wallet = usePjsWallet();` : source`${client === 'papi' ? source`const wallet = usePapiWallet();` : source`const wallet = useDedotWallet();`}`}`}
          const [originChain, setOriginChain] = useState<TChain>("Astar");
        
          const onSubmit = async (formValues: TFormValues) => {
            setLoading(true);
            setErrorVisible(false);
        
            try {
              ${
                evmWallet
                  ? source`const submitted = await wallet.submitTransfer(formValues);
              if (!submitted) return;`
                  : source`if (!wallet.connection) {
                alert("No account selected, connect wallet first");
                return;
              }
        
              await submitUsingSdk(
                formValues,
                wallet.connection.signer,
                wallet.connection.address,
              );`
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
                onExtensionChange={(name: string) => {
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
      render: () => source`import { useState, FormEvent, FC } from "react";
        import useCurrencyOptions from "./useCurrencyOptions";
        import {
          CHAINS,${
            swap
              ? source`
          EXCHANGE_CHAINS,
          isExchange,
          type TExchangeChain,`
              : ''
          }
          isChain,
          type TChain,
        } from "${sdkPackage}";
        import type { TFormValues } from "./types";
        
        type TProps = {
          onSubmit: (values: TFormValues) => void;
          originChain: TChain;
          onOriginChange: (origin: TChain) => void;
          loading: boolean;
        };
        
        const TransferForm: FC<TProps> = ({
          onSubmit,
          originChain,
          onOriginChange,
          loading,
        }) => {
          const [destinationChain, setDestinationChain] = useState<TChain>("Hydration");
          const [currencyOptionId, setCurrencyOptionId] = useState("");
          ${
            swap
              ? source`const [currencyToOptionId, setCurrencyToOptionId] = useState("");
          const [swapEnabled, setSwapEnabled] = useState(false);
          const [exchange, setExchange] = useState<TExchangeChain[]>([]);
          const AUTO_EXCHANGE_VALUE = "";
          const exchangeSelectValue =
            exchange.length > 0 ? exchange : [AUTO_EXCHANGE_VALUE];
          `
              : ''
          }const [recipient, setRecipient] = useState(
            "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
          );
          const [amount, setAmount] = useState("5");
        
          const { currencyOptions, currencyMap${swap ? source`, currencyToOptions, currencyToMap` : ''} } =
            useCurrencyOptions(originChain, destinationChain${swap ? source`, swapEnabled, exchange` : ''});
        
          const selectedCurrencyOptionId = currencyOptions.some(
            (option) => option.value === currencyOptionId,
          )
            ? currencyOptionId
            : currencyOptions.at(-1)?.value;${
              swap
                ? source`
        
          const selectedCurrencyToOptionId = currencyToOptions.some(
            (option) => option.value === currencyToOptionId,
          )
            ? currencyToOptionId
            : currencyToOptions.at(-1)?.value;
        
          const handleExchangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setExchange(
              Array.from(e.target.selectedOptions, (o) => o.value).filter(isExchange),
            );
          };
          `
                : ''
            }
        
          const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!selectedCurrencyOptionId) return;${
              swap
                ? source`
            if (swapEnabled && !selectedCurrencyToOptionId) return;
            const selectedCurrencyTo =
              swapEnabled && selectedCurrencyToOptionId
                ? currencyToMap[selectedCurrencyToOptionId]
                : undefined;`
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
              exchange,`
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
                  onChange={(e) => {
                    const chain = e.target.value;
                    if (isChain(chain)) {
                      onOriginChange(chain);
                    }
                  }}
                  disabled={loading}
                  required
                >
                  {CHAINS.map((chain) => (
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
                  onChange={(e) => {
                    const chain = e.target.value;
                    if (isChain(chain)) {
                      setDestinationChain(chain);
                    }
                  }}
                  disabled={loading}
                  required
                >
                  {CHAINS.map((chain) => (
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
                  {currencyOptions.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
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
              </label>${
                swap
                  ? source`
        
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
                      Optional. Auto lets the router pick a route. Hold Ctrl/Cmd to select specific exchanges.
                    </small>
                    <select
                      multiple
                      size={EXCHANGE_CHAINS.length + 1}
                      value={exchangeSelectValue}
                      onChange={handleExchangeChange}
                    >
                      <option value={AUTO_EXCHANGE_VALUE}>Auto</option>
                      {EXCHANGE_CHAINS.map((chain) => (
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
                      {currencyToOptions.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}`
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
      path: 'src/evm/eip6963.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/eip6963.ts')}
        `,
    },
    {
      path: 'src/evm/evmWalletClient.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/evmWalletClient')}
        `,
    },
    {
      path: 'src/evm/getViemChain.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/getViemChain')}
        `,
    },
    {
      path: 'src/evm/isEvmOrigin.ts',
      skip: client === 'papi' && !evmWallet,
      render: () => source`${renderFragment('evm/isEvmOrigin.sdk')}
        `,
    },
    {
      path: 'src/evm/utils.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/utils.ts')}
        `,
    },
    {
      path: 'src/index.css',
      render: () => source`${renderFragment('spa/index.css')}
        `,
    },
    {
      path: 'src/main.tsx',
      render: () => source`import { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import App from "./App.tsx";
        import "./index.css";
        
        const rootElement = document.getElementById("root");
        if (!rootElement) {
          throw new Error("Root element #root not found.");
        }
        
        createRoot(rootElement).render(
          <StrictMode>
            <App />
          </StrictMode>,
        );
        `,
    },
    {
      path: 'src/requireAsset.ts',
      render: () => source`${renderFragment('requireAsset')}
        `,
    },
    {
      path: 'src/types.ts',
      render: () => source`${renderFragment('types/sdk.frontend')}
        `,
    },
    {
      path: 'src/useCurrencyOptions.ts',
      render: () => source`${renderFragment('sdk/useCurrencyOptions.react')}
        `,
    },
    {
      path: 'src/vite-env.d.ts',
      render: () => source`${renderFragment('spa/vite-env.d')}
        `,
    },
    {
      path: 'src/wallet/dedot/useDedotWallet.ts',
      skip: client !== 'dedot',
      render: () => source`${renderFragment('wallet/useExtensionWallet.react')}
        `,
    },
    {
      path: 'src/wallet/dedot/useWalletWithEvm.ts',
      skip: !(evmWallet && client === 'dedot'),
      render:
        () => source`${renderFragment('wallet/useWalletWithEvm.sdk.react')}
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
      path: ['src/wallet/', client, '/index.ts'].join(''),
      render: () => source`${
        evmWallet
          ? source`export {
          useWalletWithEvm as useWallet,
          WalletControls,
        } from "./useWalletWithEvm";
        export { WalletKindSelector } from "../evm/WalletKindSelector";
        export type { TUseWalletReturn, TWalletKind, TWalletKindSelectorProps } from "../../types";
        `
          : source`${
              client === 'pjs'
                ? source`export { usePjsWallet } from "./usePjsWallet";
        export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
        `
                : source`${
                    client === 'papi'
                      ? source`export { usePapiWallet } from "./usePapiWallet";
        export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
        `
                      : source`export { useDedotWallet } from "./useDedotWallet";
        export { SubstrateWalletControls } from "../shared/SubstrateWalletControls";
        `
                  }`
            }`
      }
        `,
    },
    {
      path: 'src/wallet/papi/usePapiWallet.ts',
      skip: client !== 'papi',
      render: () => source`${renderFragment('wallet/usePapiWallet.react')}
        `,
    },
    {
      path: 'src/wallet/papi/useWalletWithEvm.ts',
      skip: !(evmWallet && client === 'papi'),
      render:
        () => source`${renderFragment('wallet/useWalletWithEvm.sdk.react')}
        `,
    },
    {
      path: 'src/wallet/pjs/usePjsWallet.ts',
      skip: client !== 'pjs',
      render: () => source`${renderFragment('wallet/useExtensionWallet.react')}
        `,
    },
    {
      path: 'src/wallet/pjs/useWalletWithEvm.ts',
      skip: !(evmWallet && client === 'pjs'),
      render:
        () => source`${renderFragment('wallet/useWalletWithEvm.sdk.react')}
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
      render: () => source`${renderFragment('wallet/submitTransfer.sdk')}
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
      path: 'src/xcm/dedot.ts',
      skip: client !== 'dedot',
      render: () => source`${renderFragment('xcm/dedot')}
        `,
    },
    {
      path: 'src/xcm/evmTransfer.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('xcm/evmTransfer.sdk')}
        `,
    },
    {
      path: 'src/xcm/papi.ts',
      skip: client !== 'papi',
      render: () => source`${renderFragment('xcm/papi')}
        `,
    },
    {
      path: 'src/xcm/pjs.ts',
      skip: client !== 'pjs',
      render: () => source`${renderFragment('xcm/pjs')}
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
      render: () => source`import { defineConfig } from "vite";
        import react from "@vitejs/plugin-react";
        import wasm from "vite-plugin-wasm";
        
        export default defineConfig({
          plugins: [react(), wasm()],
        });
        `,
    },
  ];
};
