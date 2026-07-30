import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TSdkFragmentId = Extract<TFragmentId, `sdk/${string}`>;

export const createSdkFragments: TFragmentFactory<TSdkFragmentId> = (
  context,
) => {
  const {
    sdkPackage,
    extensions: { swap },
  } = context;

  return {
    'sdk/useCurrencyOptions.react':
      () => source`import type { TAssetInfo, TChain${swap ? source`, TExchangeInput` : ''} } from "${sdkPackage}";
        import { getSupportedAssets } from "${sdkPackage}";${
          swap
            ? source`
        import {
          getSupportedAssetsFrom,
          getSupportedAssetsTo,
        } from "@paraspell/swap";`
            : ''
        }
        import { useMemo } from "react";

        const createAssetOptions = (assets: TAssetInfo[]) => {
          const map = new Map(
            assets.map((asset) => [JSON.stringify(asset.location), asset]),
          );

          return {
            map,
            options: Array.from(map, ([value, asset]) => ({
              value,
              label: \`\${asset.symbol} - \${asset.assetId ?? "Location"}\`,
            })),
          };
        };
        
        export const useCurrencyOptions = (
          from: TChain,
          to: TChain,${
            swap
              ? source`
          swapEnabled: boolean,
          exchange?: TExchangeInput,`
              : ''
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
            [from, to${swap ? source`, swapEnabled, exchange` : ''}],
          );${
            swap
              ? source`
        
          const supportedAssetsTo = useMemo(
            () => (swapEnabled ? getSupportedAssetsTo(exchange, to) : []),
            [swapEnabled, exchange, to],
          );`
              : ''
          }
        
          const { map: currencyMap, options: currencyOptions } = useMemo(
            () => createAssetOptions(supportedAssets),
            [supportedAssets],
          );${
            swap
              ? source`
        
          const { map: currencyToMap, options: currencyToOptions } = useMemo(
            () => createAssetOptions(supportedAssetsTo),
            [supportedAssetsTo],
          );`
              : ''
          }
        
          return {
            currencyOptions,
            currencyMap,${
              swap
                ? source`
            currencyToOptions,
            currencyToMap,`
                : ''
            }
          };
        };
        
        `,
    'sdk/useCurrencyOptions.vue': () => source`import type { Ref } from "vue";
        import { computed } from "vue";
        import type { TAssetInfo, TChain${swap ? source`, TExchangeInput` : ''} } from "${sdkPackage}";
        import { getSupportedAssets } from "${sdkPackage}";${
          swap
            ? source`
        import {
          getSupportedAssetsFrom,
          getSupportedAssetsTo,
        } from "@paraspell/swap";`
            : ''
        }
        
        const createAssetOptions = (assets: TAssetInfo[]) => {
          const map = new Map(
            assets.map((asset) => [JSON.stringify(asset.location), asset]),
          );

          return {
            map,
            options: Array.from(map, ([value, asset]) => ({
              value,
              label: \`\${asset.symbol} - \${asset.assetId ?? "Location"}\`,
            })),
          };
        };
        
        export const useCurrencyOptions = (
          from: Ref<TChain>,
          to: Ref<TChain>,${
            swap
              ? source`
          swapEnabled: Ref<boolean>,
          exchange: Ref<TExchangeInput | undefined>,`
              : ''
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
              : ''
          }
        
          const currencyData = computed(() =>
            createAssetOptions(supportedAssets.value),
          );
          const currencyMap = computed(() => currencyData.value.map);
          const currencyOptions = computed(() => currencyData.value.options);${
            swap
              ? source`
        
          const currencyToData = computed(() =>
            createAssetOptions(supportedAssetsTo.value),
          );
          const currencyToMap = computed(() => currencyToData.value.map);
          const currencyToOptions = computed(() => currencyToData.value.options);`
              : ''
          }
        
          return {
            currencyOptions,
            currencyMap,${
              swap
                ? source`
            currencyToOptions,
            currencyToMap,`
                : ''
            }
          };
        };
        
        `,
  };
};
