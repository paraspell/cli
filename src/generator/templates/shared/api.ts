import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TApiFragmentId = Extract<TFragmentId, `api/${string}`>;

export const createApiFragments: TFragmentFactory<TApiFragmentId> = (
  context,
  renderFragment,
) => {
  const {
    framework,
    extensions: { swap },
    evmWallet,
  } = context;

  return {
    'api/buildApiParams': () => source`type TBuildApiParams = {
          from: string | undefined;
          to: string | undefined;
          recipient: string;
          sender: string;
          amount: string;
          currencyLocation: object;${
            swap
              ? source`
          currencyToLocation?: object;
          exchange?: string[];`
              : ''
          }
        };

        const buildApiParams = ({
          from,
          to,
          recipient,
          sender,
          amount,
          currencyLocation,${
            swap
              ? source`
          currencyToLocation,
          exchange,`
              : ''
          }
        }: TBuildApiParams): TApiParams => ({
          from,
          to,
          recipient,
          sender,
          currency: {
            location: currencyLocation,
            amount,
          },${
            swap
              ? source`
          ...(currencyToLocation
            ? {
                swapOptions: {
                  currencyTo: { location: currencyToLocation },
                  ...(exchange?.length ? { exchange } : {}),
                },
              }
            : {}),`
              : ''
          }
        });
        `,
    'api/consts':
      () => source`export const API_URL = "https://api.paraspell.xyz/v1";
        `,
    'api/fetchFromApi': () => source`import axios from "axios";
        ${
          evmWallet
            ? source`import type { Hex } from "viem";
        `
            : ''
        }import { API_URL } from "./${framework === 'node' ? 'consts.js' : 'constants'}";
        import type { TApiParams, TApiTransaction, TApiErrorResponse } from "${framework === 'node' ? './types.js' : '../types'}";
        
        const postToApi = async <T>(
          url: string,
          params: TApiParams,
          errorContext: string,
        ): Promise<T> => {
          try {
            const response = await axios.post<T>(url, params);
            return response.data;
          } catch (error) {
            if (axios.isAxiosError<TApiErrorResponse>(error)) {
              const message = error.response?.data.message;
              const serverMessage = message ? \` Server response: \${message}\` : "";
              throw new Error(\`Error while \${errorContext}.\${serverMessage}\`, {
                cause: error,
              });
            }
            throw error;
          }
        };
        
        export const fetchFromApi = (params: TApiParams): Promise<TApiTransaction[]> =>
          postToApi(\`\${API_URL}/x-transfers\`, params, "fetching data");
        
        ${
          evmWallet
            ? source`export const fetchFromEvmApi = (params: TApiParams): Promise<Hex> =>
          postToApi(\`\${API_URL}/evm-x-transfer\`, params, "fetching EVM transaction");
        `
            : ''
        }
        `,
    'api/submitEvmTx':
      () => source`import { parseTransaction, type Hex, type WalletClient } from "viem";
        
        export const submitEvmTx = async (
          serializedTx: Hex,
          walletClient: WalletClient,
        ): Promise<Hex> => {
          const account = walletClient.account;
          if (!account) {
            throw new Error("Wallet has no account. Connect wallet and try again.");
          }
        
          const chain = walletClient.chain;
          if (!chain) {
            throw new Error("Wallet client has no chain configured.");
          }
        
          const parsed = parseTransaction(serializedTx);
        
          return walletClient.sendTransaction({
            account,
            chain,
            to: parsed.to ?? undefined,
            data: parsed.data,
            value: parsed.value,
          });
        };
        `,
    'api/useApiData.react': () => source`import axios from "axios";
        import { useEffect, useState } from "react";

        const toError = (error: unknown): Error =>
          error instanceof Error ? error : new Error(String(error));

        type TApiDataState<T> = {
          url: string;
          data: T[];
          error: Error | null;
        };

        export const useApiData = <T>(url: string | undefined) => {
          const [state, setState] = useState<TApiDataState<T> | null>(null);

          useEffect(() => {
            if (!url) return;

            const controller = new AbortController();

            void axios
              .get<T[]>(url, { signal: controller.signal })
              .then((response) => {
                setState({ url, data: response.data, error: null });
              })
              .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                  setState({ url, data: [], error: toError(error) });
                }
              });

            return () => {
              controller.abort();
            };
          }, [url]);

          const current = state?.url === url ? state : null;
          return {
            data: current?.data ?? [],
            loading: Boolean(url) && !current,
            error: current?.error ?? null,
          };
        };
        `,
    'api/useApiData.vue': () => source`import axios from "axios";
        import { ref, shallowRef, watch, type Ref } from "vue";

        const toError = (error: unknown): Error =>
          error instanceof Error ? error : new Error(String(error));

        export const useApiData = <T>(url: Ref<string | undefined>) => {
          const data = shallowRef<T[]>([]);
          const loading = ref(false);
          const error = shallowRef<Error | null>(null);

          watch(
            url,
            (value, _previous, onCleanup) => {
              if (!value) {
                data.value = [];
                loading.value = false;
                error.value = null;
                return;
              }

              const controller = new AbortController();
              onCleanup(() => controller.abort());
              data.value = [];
              loading.value = true;
              error.value = null;

              void axios
                .get<T[]>(value, { signal: controller.signal })
                .then((response) => {
                  data.value = response.data;
                })
                .catch((caught: unknown) => {
                  if (!controller.signal.aborted) error.value = toError(caught);
                })
                .finally(() => {
                  if (!controller.signal.aborted) loading.value = false;
                });
            },
            { immediate: true },
          );

          return { data, loading, error };
        };
        `,
    'api/submitUsingApi': () => source`import axios from "axios";
        import { Binary } from "polkadot-api";
        import type { PolkadotSigner } from "polkadot-api";
        import { createWsClient } from "polkadot-api/ws";
        import { API_URL } from "./constants";
        import { fetchFromApi${evmWallet ? source`, fetchFromEvmApi` : ''} } from "./fetchFromApi";
        ${
          swap
            ? source`import { requireSwapCurrency } from "./requireSwapCurrency";
        `
            : ''
        }
        ${
          evmWallet
            ? source`import { submitEvmTx } from "./submitEvmTx";
        `
            : ''
        }import { submitPapiTransaction } from "./submitPapiTransaction";
        import type {
          TApiParams,
          TApiTransaction,
          TFormValues${
            evmWallet
              ? source`,
          TEvmOriginHelpers,
          TWalletSubmitOptions`
              : ''
          },
        } from "../types";
        
        ${renderFragment('api/buildApiParams')}
        
        const submitApiTransaction = async (
          apiTx: TApiTransaction,
          signer: PolkadotSigner,
        ) => {
          const response = await axios.get<string[]>(
            \`\${API_URL}/chains/\${apiTx.chain}/ws-endpoints\`,
          );
          const [endpoint] = response.data;
          if (!endpoint) {
            throw new Error(\`No WebSocket endpoint returned for \${apiTx.chain}.\`);
          }
        
          const client = createWsClient(endpoint);
          try {
            const callData = Binary.fromHex(apiTx.tx);
            const tx = await client.getUnsafeApi().txFromCallData(callData);
            await submitPapiTransaction(tx, signer);
          } finally {
            client.destroy();
          }
        };
        ${
          evmWallet
            ? source`
        export const submitUsingApi = async (
          formValues: TFormValues,
          options: TWalletSubmitOptions<PolkadotSigner>,
          evmOrigins: TEvmOriginHelpers,
        ): Promise<void> => {
          const currency = formValues.currency;
        ${
          swap
            ? source`  const swapCurrencyTo = formValues.swapEnabled
            ? requireSwapCurrency(formValues.currencyTo)
            : undefined;
        `
            : ''
        }
        
          await evmOrigins.ensureEvmOriginChains();
        
          if (evmOrigins.isEvmOrigin(formValues.from)) {
            if (options.kind !== "evm") {
              throw new Error("EVM origin requires a connected EVM wallet.");
            }
        
            const sender = options.walletClient.account?.address;
            if (!sender) {
              throw new Error("EVM wallet has no connected account.");
            }
        
            const serializedTx = await fetchFromEvmApi(
              buildApiParams({
                from: formValues.from,
                to: formValues.to,
                recipient: formValues.recipient,
                sender,
                amount: formValues.amount,
                currencyLocation: currency.location,${
                  swap
                    ? source`
                currencyToLocation: formValues.swapEnabled && swapCurrencyTo
                  ? swapCurrencyTo.location
                  : undefined,
                exchange: formValues.exchange,`
                    : ''
                }
              }),
            );
            await submitEvmTx(serializedTx, options.walletClient);
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new Error("Substrate origin requires a Polkadot extension wallet.");
          }
        
          const transactions = await fetchFromApi(
            buildApiParams({
              from: formValues.from,
              to: formValues.to,
              recipient: formValues.recipient,
              sender: options.senderAddress,
              amount: formValues.amount,
              currencyLocation: currency.location,${
                swap
                  ? source`
              currencyToLocation: formValues.swapEnabled && swapCurrencyTo
                ? swapCurrencyTo.location
                : undefined,
              exchange: formValues.exchange,`
                  : ''
              }
            }),
          );
        
          for (const apiTx of transactions) {
            await submitApiTransaction(apiTx, options.signer);
          }
        };
        `
            : source`
        export const submitUsingApi = async (
          formValues: TFormValues,
          signer: PolkadotSigner,
          senderAddress: string,
        ): Promise<void> => {
          const currency = formValues.currency;
        ${
          swap
            ? source`  const swapCurrencyTo = formValues.swapEnabled
            ? requireSwapCurrency(formValues.currencyTo)
            : undefined;
        `
            : ''
        }
        
          const transactions = await fetchFromApi(
            buildApiParams({
              from: formValues.from,
              to: formValues.to,
              recipient: formValues.recipient,
              sender: senderAddress,
              amount: formValues.amount,
              currencyLocation: currency.location,${
                swap
                  ? source`
              currencyToLocation: formValues.swapEnabled && swapCurrencyTo
                ? swapCurrencyTo.location
                : undefined,
              exchange: formValues.exchange,`
                  : ''
              }
            }),
          );
        
          for (const apiTx of transactions) {
            await submitApiTransaction(apiTx, signer);
          }
        };
        `
        }
        `,
  };
};
