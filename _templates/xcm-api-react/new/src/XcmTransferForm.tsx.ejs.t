---
to: src/XcmTransferForm.tsx
---
import axios from "axios";
import { useState, useMemo, FormEvent, FC, useEffect } from "react";
import { API_URL } from "./consts";
import type { AssetInfo, FormValues } from "./types";<% if (swap) { %>
import { useExchangeChains } from "./swap";<% } %>

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
  originChain: string;
  onOriginChange: (origin: string) => void;
};

const TransferForm: FC<Props> = ({
  onSubmit,
  loading,
  originChain,
  onOriginChange,
}) => {
  const [chains, setChains] = useState<string[]>([]);
  const [destinationChain, setDestinationChain] = useState("Hydration");
  const [supportedAssets, setSupportedAssets] = useState<AssetInfo[]>([]);
  const [currencyOptionId, setCurrencyOptionId] = useState("");
  <% if (swap) { %>const [supportedSwapAssets, setSupportedSwapAssets] = useState<AssetInfo[]>([]);
  const [currencyToOptionId, setCurrencyToOptionId] = useState("");
  const [swapEnabled, setSwapEnabled] = useState(false);
  const [exchange, setExchange] = useState<string[]>([]);
  const AUTO_EXCHANGE_VALUE = "";
  const exchangeSelectValue =
    exchange.length > 0 ? exchange : [AUTO_EXCHANGE_VALUE];
  const { chains: exchangeChains } = useExchangeChains();
  <% } %>const [recipient, setRecipient] = useState(
    "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
  );
  const [amount, setAmount] = useState("5");

  useEffect(() => {
    const fetchChains = async () => {
      const response = await axios.get(`${API_URL}/chains`);
      setChains(response.data);
    };
    void fetchChains();
  }, []);

  useEffect(() => {
    const fetchAssets = async () => {
      const response = await axios.get<AssetInfo[]>(
        `${API_URL}/supported-assets?origin=${originChain}&destination=${destinationChain}`,
      );
      setSupportedAssets(response.data);
    };
    void fetchAssets();
  }, [originChain, destinationChain]);

  <% if (swap) { %>useEffect(() => {
    if (!swapEnabled) {
      return;
    }

    let cancelled = false;

    const fetchSwapAssets = async () => {
      const response = await axios.get<AssetInfo[]>(
        `${API_URL}/supported-assets?origin=${destinationChain}&destination=${originChain}`,
      );
      if (!cancelled) {
        setSupportedSwapAssets(response.data);
      }
    };
    void fetchSwapAssets();

    return () => {
      cancelled = true;
    };
  }, [originChain, destinationChain, swapEnabled]);

  <% } %>
  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce(
        (map: Record<string, AssetInfo>, asset: AssetInfo) => {
          const key = `${asset.symbol ?? "NO_SYMBOL"}-${JSON.stringify(asset.location)}`;
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
        label: `${currencyMap[key].symbol ?? "Unknown"} - ${currencyMap[key].assetId ?? "Location"}`,
      })),
    [currencyMap],
  );

  const selectedCurrencyOptionId = currencyOptions.some(
    (option) => option.value === currencyOptionId,
  )
    ? currencyOptionId
    : currencyOptions.at(-1)?.value;
<% if (swap) { %>

  const currencyToMap = useMemo(
    () =>
      supportedSwapAssets.reduce(
        (map: Record<string, AssetInfo>, asset: AssetInfo) => {
          const key = `${asset.symbol ?? "NO_SYMBOL"}-${JSON.stringify(asset.location)}`;
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
        label: `${currencyToMap[key].symbol ?? "Unknown"} - ${currencyToMap[key].assetId ?? "Location"}`,
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
<% } %>

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCurrencyOptionId) return;
<% if (swap) { %>
    let selectedCurrencyTo: AssetInfo | undefined;
    if (swapEnabled) {
      if (!selectedCurrencyToOptionId) return;
      selectedCurrencyTo = currencyToMap[selectedCurrencyToOptionId];
      if (!selectedCurrencyTo) return;
    }
<% } %>

    onSubmit({
      from: originChain,
      to: destinationChain,
      recipient,
      amount,
      currency: currencyMap[selectedCurrencyOptionId],<% if (swap) { %>
      swapEnabled,
      currencyTo: selectedCurrencyTo,
      exchange: swapEnabled ? exchange : undefined,<% } %>
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

      <% if (swap) { %>
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
      <% } %>

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit transaction"}
      </button>
    </form>
  );
};

export default TransferForm;
