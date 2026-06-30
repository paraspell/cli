import type { TAssetInfo, TChain<% if (swap) { %>, TExchangeInput<% } %> } from "<%= sdkPackage %>";
import { getSupportedAssets } from "<%= sdkPackage %>";<% if (swap) { %>
import {
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
} from "@paraspell/swap";<% } %>
import { useMemo } from "react";

const useCurrencyOptions = (
  from: TChain,
  to: TChain,<% if (swap) { %>
  swapEnabled: boolean,
  exchange?: TExchangeInput,<% } %>
) => {
  const supportedAssets = useMemo(
    () =><% if (swap) { %>
      swapEnabled
        ? getSupportedAssetsFrom(from, exchange)
        : getSupportedAssets(from, to)<% } else { %>
      getSupportedAssets(from, to)<% } %>,
    [from, to<% if (swap) { %>, swapEnabled, exchange<% } %>],
  );<% if (swap) { %>

  const supportedAssetsTo = useMemo(
    () => (swapEnabled ? getSupportedAssetsTo(exchange, to) : []),
    [swapEnabled, exchange, to],
  );<% } %>

  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce(
        (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
          const key = `${asset.symbol ?? "NO_SYMBOL"}-${
            ("assetId" in asset
              ? asset.assetId
              : JSON.stringify(asset?.location)) ?? "NO_ID"
          }`;
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
        label: `${currencyMap[key].symbol} - ${
          ("assetId" in currencyMap[key]
            ? currencyMap[key].assetId
            : "Location") ?? "Native"
        }`,
      })),
    [currencyMap],
  );<% if (swap) { %>

  const currencyToMap = useMemo(
    () =>
      supportedAssetsTo.reduce(
        (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
          const key = `${asset.symbol ?? "NO_SYMBOL"}-${
            ("assetId" in asset
              ? asset.assetId
              : JSON.stringify(asset?.location)) ?? "NO_ID"
          }`;
          map[key] = asset;
          return map;
        },
        {},
      ),
    [supportedAssetsTo],
  );

  const currencyToOptions = useMemo(
    () =>
      Object.keys(currencyToMap).map((key) => ({
        value: key,
        label: `${currencyToMap[key].symbol} - ${
          ("assetId" in currencyToMap[key]
            ? currencyToMap[key].assetId
            : "Location") ?? "Native"
        }`,
      })),
    [currencyToMap],
  );<% } %>

  return {
    currencyOptions,
    currencyMap,<% if (swap) { %>
    currencyToOptions,
    currencyToMap,<% } %>
  };
};

export default useCurrencyOptions;
