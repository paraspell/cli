import type { TTemplateContext, TTemplateFile } from '../../types.js';
import { createFragmentFile } from '../fragment-file.js';
import type { TFragmentRenderer } from '../shared/fragment-types.js';
import { createSpaToolingTemplates } from '../spa-tooling.js';
import { source } from '../source.js';

export const createReactSdkTemplates = (
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
      path: 'src/App.tsx',
      render: () => source`import "./App.css";
        ${
          swap
            ? source`import "@paraspell/swap";
        `
            : ''
        }${renderFragment('paraspell-side-effects')}import { XcmTransfer } from "./components/XcmTransfer";
        
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
      path: 'src/components/XcmTransfer.tsx',
      render: () => source`import { useState, type FC } from "react";
        import { TransferForm } from "./TransferForm";
        import type { TFormValues } from "../types";
        import type { TChain } from "${sdkPackage}";
        import { toError } from "../utils/toError";
        ${
          evmWallet
            ? source`import { WalletControls } from "./WalletControls";
        import { WalletKindSelector } from "./WalletKindSelector";
        import { useWalletWithEvm } from "../hooks/useWalletWithEvm";`
            : source`import { SubstrateWalletControls } from "./SubstrateWalletControls";
        import { use${clientName}Wallet } from "../hooks/use${clientName}Wallet";`
        }${
          !evmWallet
            ? source`
        import { submitUsingSdk } from "../utils/submitUsingSdk";`
            : ''
        }
        export const XcmTransfer: FC = () => {
          const [error, setError] = useState<Error | null>(null);
          const [loading, setLoading] = useState(false);
        
          const wallet = ${
            evmWallet ? 'useWalletWithEvm()' : `use${clientName}Wallet()`
          };
          const [originChain, setOriginChain] = useState<TChain>("Astar");
        
          const onSubmit = async (formValues: TFormValues) => {
            setLoading(true);
            setError(null);
        
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
              {error && (
                <p className="transferError" role="alert">
                  {error.message}
                </p>
              )}
            </div>
          );
        };
        
        `,
    },
    {
      path: 'src/components/TransferForm.tsx',
      render:
        () => source`import { useState, type FC, type FormEvent } from "react";
        import { useCurrencyOptions } from "../hooks/useCurrencyOptions";
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
        import type { TFormValues } from "../types";
        
        type TProps = {
          onSubmit: (values: TFormValues) => void;
          originChain: TChain;
          onOriginChange: (origin: TChain) => void;
          loading: boolean;
        };
        
        export const TransferForm: FC<TProps> = ({
          onSubmit,
          originChain,
          onOriginChange,
          loading,
        }) => {
          const [destinationChain, setDestinationChain] = useState<TChain>("Hydration");
          const [currencyLocation, setCurrencyLocation] = useState("");
          ${
            swap
              ? source`const [currencyToLocation, setCurrencyToLocation] = useState("");
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
        
          const selectedCurrencyLocation = currencyMap.has(currencyLocation)
            ? currencyLocation
            : currencyOptions.at(0)?.value;${
              swap
                ? source`
        
          const selectedCurrencyToLocation = currencyToMap.has(currencyToLocation)
            ? currencyToLocation
            : currencyToOptions.at(0)?.value;
        
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
            if (!selectedCurrencyLocation) return;
            const currency = currencyMap.get(selectedCurrencyLocation);
            if (!currency) return;${
              swap
                ? source`
            if (swapEnabled && !selectedCurrencyToLocation) return;
            const selectedCurrencyTo =
              swapEnabled && selectedCurrencyToLocation
                ? currencyToMap.get(selectedCurrencyToLocation)
                : undefined;
            if (swapEnabled && !selectedCurrencyTo) return;`
                : ''
            }
        
            onSubmit({
              from: originChain,
              to: destinationChain,
              recipient,
              amount,
              currency,${
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
                  value={selectedCurrencyLocation}
                  onChange={(e) => setCurrencyLocation(e.target.value)}
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
                  min="0"
                  step="any"
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
                      value={selectedCurrencyToLocation}
                      onChange={(e) => setCurrencyToLocation(e.target.value)}
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
        
        `,
    },
    fragment('src/utils/eip6963.ts', 'evm/eip6963.ts', !evmWallet),
    fragment('src/utils/getViemChain.ts', 'evm/getViemChain', !evmWallet),
    fragment('src/utils/evmWallet.ts', 'evm/utils.ts', !evmWallet),
    fragment('src/index.css', 'spa/index.css'),
    fragment('src/utils/toError.ts', 'spa/toError'),
    fragment('src/utils/requireSwapCurrency.ts', 'requireAsset', !swap),
    fragment('src/types.ts', 'types/sdk.frontend'),
    fragment('src/hooks/useCurrencyOptions.ts', 'sdk/useCurrencyOptions.react'),
    fragment(
      `src/hooks/use${clientName}Wallet.ts`,
      client === 'papi'
        ? 'wallet/usePapiWallet.react'
        : 'wallet/useExtensionWallet.react',
    ),
    fragment(
      'src/hooks/useWalletWithEvm.ts',
      'wallet/useWalletWithEvm.sdk',
      !evmWallet,
    ),
    fragment(
      'src/components/EvmWalletControls.tsx',
      'evm/EvmWalletControls.react',
      !evmWallet,
    ),
    fragment(
      'src/components/WalletKindSelector.tsx',
      'evm/WalletKindSelector.react',
      !evmWallet,
    ),
    fragment('src/hooks/useEvmWallet.ts', 'evm/useEvmWallet.react', !evmWallet),
    fragment(
      'src/components/SubstrateWalletControls.tsx',
      'wallet/SubstrateWalletControls.react',
    ),
    fragment(
      'src/components/WalletControls.tsx',
      'wallet/WalletControls.react',
      !evmWallet,
    ),
    fragment(
      'src/utils/connectWalletAlert.ts',
      'wallet/connectWalletAlert',
      !evmWallet,
    ),
    fragment(
      'src/hooks/useWalletWithEvmCore.ts',
      'wallet/useWalletWithEvmCore.react',
      !evmWallet,
    ),
    fragment('src/utils/submitUsingSdk.ts', `xcm/${client}`),
    fragment(
      'src/utils/submitEvmTransfer.ts',
      'xcm/evmTransfer.sdk',
      !evmWallet,
    ),
    fragment(
      'src/utils/submitPapiTransaction.ts',
      'papi/submitTransaction',
      client !== 'papi',
    ),
    ...createSpaToolingTemplates(context),
  ];
};
