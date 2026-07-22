import type { FragmentFactory, FragmentId } from "./contracts.js";
import { source } from "../source.js";

type SdkFragmentId = Extract<FragmentId, `sdk/${string}`>;

export const createSdkFragments: FragmentFactory<SdkFragmentId> = (context) => {
  const { sdkPackage, swap } = context;

  return {
    "sdk/useCurrencyOptions.react":
      () => source`import type { TAssetInfo, TChain${swap ? source`, TExchangeInput` : ""} } from "${sdkPackage}";
        import { getSupportedAssets } from "${sdkPackage}";${
          swap
            ? source`
        import {
          getSupportedAssetsFrom,
          getSupportedAssetsTo,
        } from "@paraspell/swap";`
            : ""
        }
        import { useMemo } from "react";
        
        const useCurrencyOptions = (
          from: TChain,
          to: TChain,${
            swap
              ? source`
          swapEnabled: boolean,
          exchange?: TExchangeInput,`
              : ""
          }
        ) => {
          const supportedAssets = useMemo(
            () =>${
              swap
                ? source`
              swapEnabled
                ? getSupportedAssetsFrom(from, exchange)
                : getSupportedAssets(from, to)`
                : source`
              getSupportedAssets(from, to)`
            },
            [from, to${swap ? source`, swapEnabled, exchange` : ""}],
          );${
            swap
              ? source`
        
          const supportedAssetsTo = useMemo(
            () => (swapEnabled ? getSupportedAssetsTo(exchange, to) : []),
            [swapEnabled, exchange, to],
          );`
              : ""
          }
        
          const currencyMap = useMemo(
            () =>
              supportedAssets.reduce(
                (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
                  const key = \`\${asset.symbol ?? "NO_SYMBOL"}-\${
                    ("assetId" in asset
                      ? asset.assetId
                      : JSON.stringify(asset?.location)) ?? "NO_ID"
                  }\`;
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
                label: \`\${currencyMap[key].symbol} - \${
                  ("assetId" in currencyMap[key]
                    ? currencyMap[key].assetId
                    : "Location") ?? "Native"
                }\`,
              })),
            [currencyMap],
          );${
            swap
              ? source`
        
          const currencyToMap = useMemo(
            () =>
              supportedAssetsTo.reduce(
                (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
                  const key = \`\${asset.symbol ?? "NO_SYMBOL"}-\${
                    ("assetId" in asset
                      ? asset.assetId
                      : JSON.stringify(asset?.location)) ?? "NO_ID"
                  }\`;
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
                label: \`\${currencyToMap[key].symbol} - \${
                  ("assetId" in currencyToMap[key]
                    ? currencyToMap[key].assetId
                    : "Location") ?? "Native"
                }\`,
              })),
            [currencyToMap],
          );`
              : ""
          }
        
          return {
            currencyOptions,
            currencyMap,${
              swap
                ? source`
            currencyToOptions,
            currencyToMap,`
                : ""
            }
          };
        };
        
        export default useCurrencyOptions;
        `,
    "sdk/useCurrencyOptions.vue": () => source`import type { Ref } from "vue";
        import { computed } from "vue";
        import type { TAssetInfo, TChain${swap ? source`, TExchangeInput` : ""} } from "${sdkPackage}";
        import { getSupportedAssets } from "${sdkPackage}";${
          swap
            ? source`
        import {
          getSupportedAssetsFrom,
          getSupportedAssetsTo,
        } from "@paraspell/swap";`
            : ""
        }
        
        const assetKey = (asset: TAssetInfo): string =>
          \`\${asset.symbol ?? "NO_SYMBOL"}-\${
            ("assetId" in asset ? asset.assetId : JSON.stringify(asset?.location)) ??
            "NO_ID"
          }\`;
        
        const useCurrencyOptions = (
          from: Ref<TChain>,
          to: Ref<TChain>,${
            swap
              ? source`
          swapEnabled: Ref<boolean>,
          exchange: Ref<TExchangeInput | undefined>,`
              : ""
          }
        ) => {
          const supportedAssets = computed(
            () =>${
              swap
                ? source`
              swapEnabled.value
                ? getSupportedAssetsFrom(from.value, exchange.value)
                : getSupportedAssets(from.value, to.value)`
                : source`
              getSupportedAssets(from.value, to.value)`
            },
          );${
            swap
              ? source`
        
          const supportedAssetsTo = computed(() =>
            swapEnabled.value ? getSupportedAssetsTo(exchange.value, to.value) : [],
          );`
              : ""
          }
        
          const currencyMap = computed(() =>
            supportedAssets.value.reduce(
              (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
                map[assetKey(asset)] = asset;
                return map;
              },
              {},
            ),
          );
        
          const currencyOptions = computed(() =>
            Object.keys(currencyMap.value).map((key) => ({
              value: key,
              label: \`\${currencyMap.value[key].symbol} - \${
                ("assetId" in currencyMap.value[key]
                  ? currencyMap.value[key].assetId
                  : "Location") ?? "Native"
              }\`,
            })),
          );${
            swap
              ? source`
        
          const currencyToMap = computed(() =>
            supportedAssetsTo.value.reduce(
              (map: Record<string, TAssetInfo>, asset: TAssetInfo) => {
                map[assetKey(asset)] = asset;
                return map;
              },
              {},
            ),
          );
        
          const currencyToOptions = computed(() =>
            Object.keys(currencyToMap.value).map((key) => ({
              value: key,
              label: \`\${currencyToMap.value[key].symbol} - \${
                ("assetId" in currencyToMap.value[key]
                  ? currencyToMap.value[key].assetId
                  : "Location") ?? "Native"
              }\`,
            })),
          );`
              : ""
          }
        
          return {
            currencyOptions,
            currencyMap,${
              swap
                ? source`
            currencyToOptions,
            currencyToMap,`
                : ""
            }
          };
        };
        
        export default useCurrencyOptions;
        `,
  };
};
