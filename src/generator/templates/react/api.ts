import type { TTemplateContext, TTemplateFile } from '../../types.js';
import { createFragmentFile } from '../fragment-file.js';
import type { TFragmentRenderer } from '../shared/fragment-types.js';
import { createSpaToolingTemplates } from '../spa-tooling.js';
import { source } from '../source.js';

export const createReactApiTemplates = (
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
      path: 'src/App.tsx',
      render: () => source`import "./App.css";
        import { XcmTransfer } from "./components/XcmTransfer";
        
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
      path: 'src/components/XcmTransfer.tsx',
      render: () => source`import { useState, type FC } from "react";
        import { TransferForm } from "./TransferForm";
        import type { TFormValues } from "../types";
        import { toError } from "../utils/toError";
        ${
          evmWallet
            ? source`
        import { WalletControls } from "./WalletControls";
        import { WalletKindSelector } from "./WalletKindSelector";
        import { useWalletWithEvm } from "../hooks/useWalletWithEvm";
        `
            : source`
        import { SubstrateWalletControls } from "./SubstrateWalletControls";
        import { usePapiWallet } from "../hooks/usePapiWallet";
        import { submitUsingApi } from "../utils/submitUsingApi";
        `
        }
        export const XcmTransfer: FC = () => {
          const [error, setError] = useState<Error | null>(null);
          const [loading, setLoading] = useState(false);
        
          ${
            evmWallet
              ? source`
          const wallet = useWalletWithEvm();
          const [originChain, setOriginChain] = useState("Astar");
          `
              : source`
          const wallet = usePapiWallet();
          const [originChain, setOriginChain] = useState("Astar");
          `
          }
        
          const onSubmit = async (formValues: TFormValues) => {
            setLoading(true);
            setError(null);
        
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
      render: () => source`import {
          useMemo,
          useState,
          ${swap ? source`type ChangeEvent,` : ''}
          type FC,
          type FormEvent,
        } from "react";
        import { useApiData } from "../hooks/useApiData";
        import { API_URL } from "../utils/constants";
        import type { TAssetInfo, TFormValues } from "../types";${
          swap
            ? source`
        import { useExchangeChains } from "../hooks/useExchangeChains";`
            : ''
        }
        
        type TProps = {
          onSubmit: (values: TFormValues) => void;
          loading: boolean;
          originChain: string;
          onOriginChange: (origin: string) => void;
        };

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
        
        export const TransferForm: FC<TProps> = ({
          onSubmit,
          loading,
          originChain,
          onOriginChange,
        }) => {
          const [destinationChain, setDestinationChain] = useState("Hydration");
          const [currencyLocation, setCurrencyLocation] = useState("");
          ${
            swap
              ? source`const [currencyToLocation, setCurrencyToLocation] = useState("");
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
          const { assetsByLocation: currencies, options: currencyOptions } = useMemo(
            () => createAssetOptions(assetsRequest.data),
            [assetsRequest.data],
          );
        
          const selectedCurrencyLocation = currencies.has(currencyLocation)
            ? currencyLocation
            : currencyOptions.at(0)?.value;
        ${
          swap
            ? source`
        
          const { assetsByLocation: currenciesTo, options: currencyToOptions } = useMemo(
            () => createAssetOptions(swapAssetsRequest.data),
            [swapAssetsRequest.data],
          );
        
          const selectedCurrencyToLocation = currenciesTo.has(currencyToLocation)
            ? currencyToLocation
            : currencyToOptions.at(0)?.value;
        
          const handleExchangeChange = (e: ChangeEvent<HTMLSelectElement>) => {
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
            if (!selectedCurrencyLocation) return;
            const currency = currencies.get(selectedCurrencyLocation);
            if (!currency) return;
        ${
          swap
            ? source`
            if (swapEnabled && !selectedCurrencyToLocation) return;
            const selectedCurrencyTo =
              swapEnabled && selectedCurrencyToLocation
                ? currenciesTo.get(selectedCurrencyToLocation)
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
              currency,${
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
                <p className="transferError" role="alert">
                  Could not load options: {dataError.message}
                </p>
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
                  value={selectedCurrencyLocation}
                  onChange={(e) => setCurrencyLocation(e.target.value)}
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
                  min="0"
                  step="any"
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
                          value={selectedCurrencyToLocation}
                          onChange={(e) => setCurrencyToLocation(e.target.value)}
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
      'src/hooks/useEvmOriginChains.ts',
      'evm/useEvmOriginChains.react',
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
      'src/hooks/useExchangeChains.ts',
      'swap/useExchangeChains.react',
      !swap,
    ),
    fragment('src/types.ts', 'types/api.frontend'),
    fragment('src/hooks/useApiData.ts', 'api/useApiData.react'),
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
    fragment('src/hooks/usePapiWallet.ts', 'wallet/usePapiWallet.react'),
    fragment(
      'src/hooks/useWalletWithEvm.ts',
      'wallet/useWalletWithEvm.api',
      !evmWallet,
    ),
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
    ...createSpaToolingTemplates(context),
  ];
};
